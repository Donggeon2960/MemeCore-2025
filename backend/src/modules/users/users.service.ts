import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private blockchainService: BlockchainService,
  ) {}

  async register(loginId: string, password: string, walletAddress: string, nickname: string) {
    const existingUser = await this.prisma.user.findUnique({ where: { loginId } });
    if (existingUser) throw new BadRequestException('이미 존재하는 아이디입니다.');

    const existingNickname = await this.prisma.user.findFirst({ where: { nickname } });
    if (existingNickname) throw new BadRequestException('이미 존재하는 닉네임입니다.');

    const userCode = `#${nickname}-${Math.floor(1000 + Math.random() * 9000)}`;

    return this.prisma.user.create({
      data: {
        loginId,
        password,
        walletAddress,
        nickname,
        userCode,
        points: 0,
        weeklyPoints: 0,
        lastNicknameChange: new Date(),
      },
    });
  }

  async login(loginId: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { loginId } });
    if (!user || user.password !== password) throw new UnauthorizedException('로그인 실패');
    return user;
  }

  async findUser(loginId: string) {
    return this.prisma.user.findUnique({ where: { loginId } });
  }

  async addPoints(loginId: string, amount: number) {
    return this.prisma.user.update({
        where: { loginId },
        data: { 
          points: { increment: amount },
          weeklyPoints: { increment: amount }
        }
    });
  }

  async resetWeeklyRanking() {
    await this.prisma.user.updateMany({
      data: { weeklyPoints: 0 }
    });
    return { message: "주간 랭킹이 초기화되었습니다." };
  }

  async getTopRankings(limit: number = 10) {
    return this.prisma.user.findMany({
      orderBy: { weeklyPoints: 'desc' },
      take: limit,
      select: { nickname: true, weeklyPoints: true, userCode: true },
    });
  }

  // [NEW] 누락되었던 함수 추가
  async getMyRank(loginId: string) {
    const user = await this.findUser(loginId);
    if (!user) throw new BadRequestException('User not found');
    
    const higherRankers = await this.prisma.user.count({ 
      where: { weeklyPoints: { gt: user.weeklyPoints } } 
    });
    
    return { 
      nickname: user.nickname, 
      points: user.weeklyPoints, 
      rank: higherRankers + 1 
    };
  }

  async toggleLike(loginId: string, submissionId: number) {
    const user = await this.prisma.user.findUnique({ where: { loginId } });
    if (!user) throw new BadRequestException("User not found");

    const existingLike = await this.prisma.like.findUnique({
      where: { userId_submissionId: { userId: user.id, submissionId } }
    });

    if (existingLike) {
      await this.prisma.like.delete({ where: { id: existingLike.id } });
      return { liked: false };
    } else {
      await this.prisma.like.create({ data: { userId: user.id, submissionId } });
      return { liked: true };
    }
  }

  async addComment(loginId: string, submissionId: number, content: string) {
    const user = await this.prisma.user.findUnique({ where: { loginId } });
    if (!user) throw new BadRequestException("User not found");

    return this.prisma.comment.create({
      data: { userId: user.id, submissionId, content }
    });
  }

  async updateProfile(loginId: string, newNickname?: string, newWallet?: string, newPassword?: string) {
    const user = await this.findUser(loginId);
    if (!user) throw new BadRequestException('User not found');

    const updateData: any = {};

    if (newNickname && newNickname !== user.nickname) {
      const nicknameExists = await this.prisma.user.findFirst({ where: { nickname: newNickname } });
      if (nicknameExists) throw new BadRequestException('이미 사용 중인 닉네임입니다.');

      if (user.lastNicknameChange) {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        if (user.lastNicknameChange > oneMonthAgo) throw new BadRequestException('닉네임은 한 달에 한 번만 변경 가능합니다.');
      }
      
      updateData.nickname = newNickname;
      updateData.lastNicknameChange = new Date(); 
      updateData.userCode = `#${newNickname}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    if (newWallet) updateData.walletAddress = newWallet;
    if (newPassword) updateData.password = newPassword;

    return this.prisma.user.update({
      where: { loginId },
      data: updateData,
    });
  }

  async swapToToken(loginId: string, amount: number) {
    const user = await this.findUser(loginId);
    if (!user) throw new BadRequestException('User not found');
    if (user.points < amount) throw new BadRequestException('Not enough points');
    if (!user.walletAddress) throw new BadRequestException('No wallet address linked');

    console.log(`🔄 Swapping ${amount} points for user ${user.nickname}...`);
    const txHash = await this.blockchainService.rewardUser(user.walletAddress, amount.toString());

    await this.prisma.user.update({
      where: { id: user.id },
      data: { points: { decrement: amount } },
    });

    return { status: 'success', txHash, remainingPoints: user.points - amount };
  }
}