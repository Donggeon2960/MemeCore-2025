import {
  BadRequestException,
  Body,
  CanActivate,
  Controller,
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
  Get,
  Injectable,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { User } from '@prisma/client';
import { randomBytes } from 'crypto';
import { verifyMessage } from 'ethers';
import { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { PrismaService } from './prisma.service';
import {
  checksumAddress,
  publicUser,
  UsersService,
} from './modules/users/users.service';
import type { RegisterInput } from './modules/users/users.service';

type AuthedRequest = Request & { user?: User };

/** Authorization: Bearer <JWT> 를 검증하고 req.user 에 DB 최신 유저를 넣는다. */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwt: JwtService,
    private prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    const token = req.headers.authorization?.replace(/^Bearer /, '');
    if (!token) throw new UnauthorizedException('로그인이 필요합니다.');
    let sub: number;
    try {
      ({ sub } = await this.jwt.verifyAsync<{ sub: number }>(token));
    } catch {
      throw new UnauthorizedException(
        '세션이 만료되었습니다. 다시 로그인해주세요.',
      );
    }
    const user = await this.prisma.user.findUnique({ where: { id: sub } });
    if (!user) throw new UnauthorizedException('존재하지 않는 계정입니다.');
    req.user = user;
    return true;
  }
}

/** AuthGuard 뒤에 붙여서 사용: @UseGuards(AuthGuard, AdminGuard) */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(ctx: ExecutionContext) {
    if (!ctx.switchToHttp().getRequest<AuthedRequest>().user?.isAdmin)
      throw new ForbiddenException('관리자 전용 기능입니다.');
    return true;
  }
}

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) =>
    ctx.switchToHttp().getRequest<AuthedRequest>().user as User,
);

/** EIP-4361 (Sign-In with Ethereum) 형식 메시지. 서버가 직접 만들고 검증 */
export function siweMessage(o: {
  origin: string;
  address: string;
  chainId: number;
  nonce: string;
  issuedAt: string;
}) {
  return [
    `${new URL(o.origin).host} wants you to sign in with your Ethereum account:`,
    o.address,
    '',
    'MemeQuest 로그인',
    '',
    `URI: ${o.origin}`,
    'Version: 1',
    `Chain ID: ${o.chainId}`,
    `Nonce: ${o.nonce}`,
    `Issued At: ${o.issuedAt}`,
  ].join('\n');
}

const NONCE_TTL_MS = 5 * 60_000;
// 비밀번호/서명 무차별 대입 방지: IP당 분당 10회
const LOGIN_THROTTLE = { default: { limit: 10, ttl: 60_000 } };

@Controller('api')
export class AuthController {
  // ponytail: 메모리 nonce 저장소 → 서버 1대 기준. 다중 인스턴스면 Redis/DB 로
  private nonces = new Map<string, { message: string; exp: number }>();

  constructor(
    private usersService: UsersService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  private async session(user: User) {
    return {
      token: await this.jwt.signAsync({ sub: user.id }),
      user: publicUser(user),
    };
  }

  @Post('register')
  async register(@Body() body: RegisterInput) {
    return this.session(await this.usersService.register(body));
  }

  @Post('login')
  @Throttle(LOGIN_THROTTLE)
  async login(@Body() body: { login_id?: unknown; password?: unknown }) {
    return this.session(
      await this.usersService.login(body.login_id, body.password),
    );
  }

  /** 지갑 로그인 1단계: 서명할 메시지 발급 */
  @Get('auth/nonce')
  nonce(@Query('address') addressRaw: unknown) {
    const address = checksumAddress(addressRaw);
    const now = Date.now();
    for (const [k, v] of this.nonces) if (v.exp < now) this.nonces.delete(k);
    const message = siweMessage({
      // 여러 개 설정된 경우 첫 번째 주소를 서명 메시지에 사용
      origin: (
        this.config.get<string>('FRONTEND_URL') || 'http://localhost:3001'
      )
        .split(',')[0]
        .trim(),
      address,
      chainId: Number(this.config.get<string>('CHAIN_ID') || 43522),
      nonce: randomBytes(12).toString('hex'),
      issuedAt: new Date(now).toISOString(),
    });
    this.nonces.set(address, { message, exp: now + NONCE_TTL_MS });
    return { message };
  }

  /** 지갑 로그인 2단계: 서명 검증 → 해당 지갑으로 가입된 계정으로 로그인 */
  @Post('login-wallet')
  @Throttle(LOGIN_THROTTLE)
  async loginWallet(@Body() body: { address?: unknown; signature?: unknown }) {
    const address = checksumAddress(body.address);
    const entry = this.nonces.get(address);
    this.nonces.delete(address); // 1회용
    if (!entry || entry.exp < Date.now())
      throw new BadRequestException(
        '서명 요청이 만료되었습니다. 다시 시도해주세요.',
      );
    let signer = '';
    try {
      signer = verifyMessage(
        entry.message,
        typeof body.signature === 'string' ? body.signature : '',
      );
    } catch {
      /* 아래에서 처리 */
    }
    if (signer !== address)
      throw new UnauthorizedException('지갑 서명이 올바르지 않습니다.');
    return this.session(await this.usersService.findByWallet(address));
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@CurrentUser() user: User) {
    return publicUser(user);
  }
}
