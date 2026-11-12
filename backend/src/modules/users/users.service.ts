import {
  BadRequestException,
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma, Quest, User } from '@prisma/client';
import { getAddress } from 'ethers';
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { PrismaService } from '../../prisma.service';
import {
  BlockchainService,
  TxUnconfirmedError,
} from '../blockchain/blockchain.service';
import { SNS_BASE_REWARD } from '../youtube.service';

const scrypt = promisify(scryptCb) as (
  pw: string,
  salt: string,
  len: number,
) => Promise<Buffer>;

export async function hashPassword(pw: string) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${(await scrypt(pw, salt, 64)).toString('hex')}`;
}

export async function verifyPassword(pw: string, stored: string) {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const actual = await scrypt(pw, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return expected.length === actual.length && timingSafeEqual(actual, expected);
}

/** 클라이언트에 내려줄 유저 정보 (비밀번호 제외) */
export function publicUser(u: User) {
  return {
    id: u.id,
    loginId: u.loginId,
    nickname: u.nickname,
    userCode: u.userCode,
    walletAddress: u.walletAddress,
    points: u.points,
    weeklyPoints: u.weeklyPoints,
    isAdmin: u.isAdmin,
  };
}

/** 신뢰할 수 없는 입력에서 문자열 필드를 꺼낸다 (trim, 길이 제한). */
export function str(
  v: unknown,
  field: string,
  max = 100,
  required = true,
): string {
  const s = typeof v === 'string' ? v.trim() : '';
  if (required && !s)
    throw new BadRequestException(`${field}을(를) 입력해주세요.`);
  if (s.length > max)
    throw new BadRequestException(
      `${field}은(는) ${max}자 이하로 입력해주세요.`,
    );
  return s;
}

/** 포인트 금액: 1 이상의 정수만 허용 (소수/음수/NaN 차단) */
export function parseAmount(v: unknown): number {
  const n = Number(v);
  if (!Number.isSafeInteger(n) || n <= 0)
    throw new BadRequestException('금액은 1 이상의 정수여야 합니다.');
  return n;
}

/** 지갑 주소 검증 + 체크섬 형식으로 정규화 */
export function checksumAddress(v: unknown): string {
  try {
    return getAddress(str(v, '지갑 주소', 42));
  } catch (e) {
    if (e instanceof BadRequestException) throw e;
    throw new BadRequestException('올바른 지갑 주소(0x...)가 아닙니다.');
  }
}

export const isEventOpen = (q: Quest) =>
  q.category === 'EVENT' && !q.settledAt && !!q.endsAt && q.endsAt > new Date();
export const EVENT_PRIZES = [5000, 3000, 1000];

const makeUserCode = (nickname: string) =>
  `#${nickname}-${1000 + (randomBytes(2).readUInt16BE() % 9000)}`;
const walletVariants = (addr: string) => [addr, addr.toLowerCase()]; // 예전 데이터는 소문자로 저장됐을 수 있음

export type RegisterInput = {
  login_id?: unknown;
  password?: unknown;
  wallet_address?: unknown;
  nickname?: unknown;
};
type Db = Prisma.TransactionClient;

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    private blockchainService: BlockchainService,
  ) {}

  /** 시스템 퀘스트(SNS) + 데모 이벤트 생성, 예전 DB 데이터 보정 (모두 멱등) */
  async onModuleInit() {
    const snsQuest =
      (await this.prisma.quest.findFirst({ where: { category: 'SNS' } })) ??
      (await this.prisma.quest.create({
        data: {
          category: 'SNS',
          title: 'SNS 바이럴',
          rewardPoints: SNS_BASE_REWARD,
        },
      }));
    await this.migrateLegacyData(snsQuest.id);
    if (await this.prisma.quest.count({ where: { category: 'EVENT' } })) return;
    const days = (n: number) => new Date(Date.now() + n * 86_400_000);
    await this.prisma.quest.createMany({
      data: [
        {
          category: 'EVENT',
          title: '슬픈 개구리 (페페) 챌린지',
          description: '가장 슬픈 개구리 밈을 만들어주세요! 웃픈 사연 대환영!',
          tokenIcon: '🐸',
          tokenSymbol: 'PEPE',
          rewardPoints: EVENT_PRIZES[0],
          endsAt: days(14),
        },
        {
          category: 'EVENT',
          title: '도지 투 더 문 챌린지',
          description: '도지코인 화성 갈끄니까~ 관련 밈이나 영상을 올려주세요.',
          tokenIcon: '🐕',
          tokenSymbol: 'DOGE',
          rewardPoints: EVENT_PRIZES[0],
          endsAt: days(7),
        },
      ],
    });
  }

  private async migrateLegacyData(snsQuestId: number) {
    // 예전엔 SNS 제출이 1번 퀘스트에 붙어 갤러리에 섞였음 → SNS 시스템 퀘스트로 이동
    await this.prisma.submission.updateMany({
      where: { snsUrl: { not: null }, questId: { not: snsQuestId } },
      data: { questId: snsQuestId },
    });
    // 예전 완료 퀘스트 표시 (completedAt 컬럼 도입 전 데이터)
    await this.prisma.quest.updateMany({
      where: {
        category: 'NORMAL',
        completedAt: null,
        submissions: { some: { status: 'APPROVED' } },
      },
      data: { completedAt: new Date() },
    });
    // 마감일 없던 예전 이벤트 → 종료 처리
    await this.prisma.quest.updateMany({
      where: { category: 'EVENT', endsAt: null },
      data: { endsAt: new Date() },
    });
  }

  private async assertWalletFree(addr: string, exceptUserId = 0) {
    const taken = await this.prisma.user.findFirst({
      where: {
        walletAddress: { in: walletVariants(addr) },
        id: { not: exceptUserId },
      },
    });
    if (taken)
      throw new BadRequestException('이미 다른 계정에 연결된 지갑 주소입니다.');
  }

  async register(body: RegisterInput) {
    const loginId = str(body.login_id, '아이디', 30);
    if (!/^[A-Za-z0-9_]{3,30}$/.test(loginId))
      throw new BadRequestException('아이디는 영문/숫자/_ 3~30자입니다.');
    const password = str(body.password, '비밀번호', 100);
    if (password.length < 8)
      throw new BadRequestException('비밀번호는 8자 이상이어야 합니다.');
    const nickname = str(body.nickname, '닉네임', 20);
    const walletAddress = checksumAddress(body.wallet_address);

    if (await this.prisma.user.findUnique({ where: { loginId } }))
      throw new BadRequestException('이미 존재하는 아이디입니다.');
    if (await this.prisma.user.findUnique({ where: { nickname } }))
      throw new BadRequestException('이미 존재하는 닉네임입니다.');
    await this.assertWalletFree(walletAddress);

    return this.prisma.user.create({
      data: {
        loginId,
        password: await hashPassword(password),
        walletAddress,
        nickname,
        userCode: makeUserCode(nickname),
        // ponytail: 첫 가입자를 관리자로. 운영 시엔 DB에서 is_admin 직접 지정
        isAdmin: (await this.prisma.user.count()) === 0,
        lastNicknameChange: new Date(),
      },
    });
  }

  async login(loginIdRaw: unknown, passwordRaw: unknown) {
    const loginId = str(loginIdRaw, '아이디', 30);
    const password = str(passwordRaw, '비밀번호', 100);
    const user = await this.prisma.user.findUnique({ where: { loginId } });
    if (!user)
      throw new UnauthorizedException(
        '아이디 또는 비밀번호가 올바르지 않습니다.',
      );
    if (await verifyPassword(password, user.password)) return user;
    // 예전 평문 저장 계정: 한 번 맞으면 해시로 교체 (이후엔 평문 비교 경로를 안 탐)
    if (!user.password.includes(':') && user.password === password)
      return this.prisma.user.update({
        where: { id: user.id },
        data: { password: await hashPassword(password) },
      });
    throw new UnauthorizedException(
      '아이디 또는 비밀번호가 올바르지 않습니다.',
    );
  }

  async findByWallet(addr: string) {
    const users = await this.prisma.user.findMany({
      where: { walletAddress: { in: walletVariants(addr) } },
    });
    if (users.length === 1) return users[0];
    throw new UnauthorizedException(
      users.length
        ? '여러 계정에 연결된 지갑입니다. 아이디로 로그인해주세요.'
        : '이 지갑으로 가입된 계정이 없습니다. 먼저 회원가입해주세요.',
    );
  }

  /** 포인트 적립 + 원장 기록. 다른 트랜잭션 안에서 호출할 땐 db 를 넘긴다. */
  async addPoints(
    userId: number,
    amount: number,
    reason: string,
    refId?: number,
    db: Db = this.prisma,
  ) {
    await db.pointLedger.create({ data: { userId, amount, reason, refId } });
    return db.user.update({
      where: { id: userId },
      data: {
        points: { increment: amount },
        weeklyPoints: { increment: amount },
      },
    });
  }

  async resetWeeklyRanking() {
    await this.prisma.user.updateMany({ data: { weeklyPoints: 0 } });
    return { message: '주간 랭킹이 초기화되었습니다.' };
  }

  getTopRankings(limit = 10) {
    return this.prisma.user.findMany({
      orderBy: { weeklyPoints: 'desc' },
      take: limit,
      select: { nickname: true, weeklyPoints: true, userCode: true },
    });
  }

  async getMyRank(user: User) {
    const higher = await this.prisma.user.count({
      where: { weeklyPoints: { gt: user.weeklyPoints } },
    });
    return {
      nickname: user.nickname,
      points: user.weeklyPoints,
      rank: higher + 1,
    };
  }

  private async submissionOrThrow(id: unknown) {
    const sub = await this.prisma.submission.findUnique({
      where: { id: Number(id) || 0 },
      include: { quest: true },
    });
    if (!sub) throw new BadRequestException('존재하지 않는 게시물입니다.');
    return sub;
  }

  async toggleLike(user: User, submissionId: unknown) {
    const sub = await this.submissionOrThrow(submissionId);
    // 정산 기준이 되는 이벤트 투표는 마감 후 변경 불가
    if (sub.quest.category === 'EVENT' && !isEventOpen(sub.quest))
      throw new BadRequestException('투표가 마감된 이벤트입니다.');
    const key = {
      userId_submissionId: { userId: user.id, submissionId: sub.id },
    };
    if (await this.prisma.like.findUnique({ where: key })) {
      await this.prisma.like.delete({ where: key });
      return { liked: false };
    }
    await this.prisma.like.create({
      data: { userId: user.id, submissionId: sub.id },
    });
    return { liked: true };
  }

  async addComment(user: User, submissionId: unknown, content: unknown) {
    const sub = await this.submissionOrThrow(submissionId);
    return this.prisma.comment.create({
      data: {
        userId: user.id,
        submissionId: sub.id,
        content: str(content, '댓글', 500),
      },
    });
  }

  async updateProfile(
    user: User,
    body: {
      nickname?: unknown;
      wallet_address?: unknown;
      password?: unknown;
      current_password?: unknown;
    },
  ) {
    const data: Prisma.UserUpdateInput = {};
    const nickname = str(body.nickname, '닉네임', 20, false);
    const wallet = str(body.wallet_address, '지갑 주소', 42, false);
    const password = str(body.password, '새 비밀번호', 100, false);

    // 지갑/비밀번호 변경은 돈이 걸린 작업 → 현재 비밀번호 재확인
    // (401 이면 프론트가 세션 만료로 보고 로그아웃시키므로 400 사용)
    if (
      (wallet || password) &&
      !(await verifyPassword(
        str(body.current_password, '현재 비밀번호', 100),
        user.password,
      ))
    )
      throw new BadRequestException('현재 비밀번호가 올바르지 않습니다.');

    if (nickname && nickname !== user.nickname) {
      if (await this.prisma.user.findUnique({ where: { nickname } }))
        throw new BadRequestException('이미 사용 중인 닉네임입니다.');
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      if (user.lastNicknameChange && user.lastNicknameChange > oneMonthAgo)
        throw new BadRequestException(
          '닉네임은 한 달에 한 번만 변경 가능합니다.',
        );
      data.nickname = nickname;
      data.lastNicknameChange = new Date();
      data.userCode = makeUserCode(nickname);
    }
    if (wallet) {
      data.walletAddress = checksumAddress(wallet);
      await this.assertWalletFree(data.walletAddress, user.id);
    }
    if (password) {
      if (password.length < 8)
        throw new BadRequestException('비밀번호는 8자 이상이어야 합니다.');
      data.password = await hashPassword(password);
    }

    return publicUser(
      await this.prisma.user.update({ where: { id: user.id }, data }),
    );
  }

  /**
   * 포인트 → $MQ 토큰 환전.
   * 1) 잔액 조건부 차감(원자적) + PENDING 원장  2) 온체인 전송  3) 전송 자체가 실패했을 때만 환불
   * 동시 요청이 와도 조건부 UPDATE 가 잔액 이상 차감을 막는다.
   */
  async swapToToken(user: User, amountRaw: unknown) {
    const amount = parseAmount(amountRaw);
    if (!user.walletAddress)
      throw new BadRequestException('연결된 지갑 주소가 없습니다.');

    const ledger = await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.user.updateMany({
        where: { id: user.id, points: { gte: amount } },
        data: { points: { decrement: amount } },
      });
      if (count === 0) throw new BadRequestException('포인트가 부족합니다.');
      return tx.pointLedger.create({
        data: {
          userId: user.id,
          amount: -amount,
          reason: 'SWAP',
          status: 'PENDING',
        },
      });
    });

    try {
      const txHash = await this.blockchainService.rewardUser(
        user.walletAddress,
        amount.toString(),
      );
      await this.prisma.pointLedger.update({
        where: { id: ledger.id },
        data: { status: 'DONE', txHash },
      });
    } catch (e) {
      if (e instanceof TxUnconfirmedError) {
        // 이미 체인에 나간 트랜잭션 → 환불하면 이중 지급. PENDING 으로 남기고 txHash 기록
        await this.prisma.pointLedger.update({
          where: { id: ledger.id },
          data: { txHash: e.txHash },
        });
        throw new BadRequestException(
          `전송은 되었지만 확정 확인이 지연되고 있습니다. (TX: ${e.txHash})`,
        );
      }
      // ponytail: RPC 가 브로드캐스트 직후 타임아웃나면 실제로 나간 tx 도 환불될 수 있음 → 운영 시 nonce 기준 재조회
      await this.prisma.$transaction([
        this.prisma.pointLedger.update({
          where: { id: ledger.id },
          data: { status: 'FAILED' },
        }),
        this.prisma.user.update({
          where: { id: user.id },
          data: { points: { increment: amount } },
        }),
        this.prisma.pointLedger.create({
          data: {
            userId: user.id,
            amount,
            reason: 'SWAP_REFUND',
            refId: ledger.id,
          },
        }),
      ]);
      throw new BadRequestException(
        '블록체인 전송에 실패하여 포인트를 환불했습니다.',
      );
    }
    const { points } = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
    });
    const { txHash } = await this.prisma.pointLedger.findUniqueOrThrow({
      where: { id: ledger.id },
    });
    return { status: 'success', txHash, remainingPoints: points };
  }
}
