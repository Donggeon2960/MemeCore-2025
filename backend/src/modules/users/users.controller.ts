import { Controller, Post, Body, Get, Query, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { readFileSync } from 'fs';

import { UsersService } from './users.service';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '../../prisma.service';
import { YoutubeService } from '../youtube.service';

@Controller('api')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly aiService: AiService,
    private readonly prisma: PrismaService,
    private readonly youtubeService: YoutubeService,
  ) {}

  // 1. 회원가입
  @Post('register')
  async register(@Body() body: { login_id: string; password?: string; wallet_address: string; nickname: string }) {
    const pw = body.password || 'password123'; 
    return this.usersService.register(body.login_id, pw, body.wallet_address, body.nickname);
  }

  // 2. 로그인
  @Post('login')
  async login(@Body() body: { login_id: string; password: string }) {
    return this.usersService.login(body.login_id, body.password);
  }

  // 3. 코인 환전
  @Post('swap-to-token')
  async swap(@Body() body: { login_id: string; amount: string | number }) {
    return this.usersService.swapToToken(body.login_id, Number(body.amount));
  }
  
  // 4. (테스트용) 포인트 받기
  @Post('cheat-points')
  async cheat(@Body() body: { login_id: string; amount: string | number }) {
      return this.usersService.addPoints(body.login_id, Number(body.amount));
  }

  // 5. 주간 랭킹 조회
  @Get('rankings')
  async getRankings() {
    return this.usersService.getTopRankings();
  }

  // 주간 랭킹 초기화 (관리자용)
  @Post('reset-ranking')
  async resetRanking() {
    return this.usersService.resetWeeklyRanking();
  }

  // 6. 내 등수 확인
  @Get('my-rank')
  async getMyRank(@Query('login_id') loginId: string) {
    return this.usersService.getMyRank(loginId);
  }

  // 7. 퀘스트 생성 (주간 3회 제한)
  @Post('generate-quest')
  async generateQuest(@Body() body: { login_id: string }) {
    const user = await this.prisma.user.findUnique({ where: { loginId: body.login_id } });
    if (!user) throw new BadRequestException('User not found');

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const count = await this.prisma.quest.count({
      where: {
        creatorId: user.id,
        createdAt: { gte: oneWeekAgo }
      }
    });

    if (count >= 3) {
      throw new BadRequestException('주간 퀘스트 생성 한도(3회)를 초과했습니다.');
    }

    const aiQuest = await this.aiService.generateDailyQuest();
    
    const savedQuest = await this.prisma.quest.create({
      data: {
        creatorId: user.id,
        title: aiQuest.title,
        content: aiQuest.content,
        targetViews: aiQuest.targetViews,
        rewardPoints: aiQuest.rewardPoints,
        category: 'NORMAL' // 일반 퀘스트
      }
    });

    return savedQuest;
  }

  // 8. 나의 퀘스트 목록 조회 (완료 여부 표시)
  @Get('my-quests')
  async getMyQuests(@Query('login_id') loginId: string) {
    const user = await this.prisma.user.findUnique({ where: { loginId } });
    if (!user) return [];
    
    const quests = await this.prisma.quest.findMany({
      where: { creatorId: user.id, category: 'NORMAL' },
      orderBy: { createdAt: 'desc' },
      include: { submissions: true }
    });

    return quests.map(q => {
        const isCompleted = q.submissions.some(sub => 
            sub.userId === user.id && sub.status === 'APPROVED'
        );
        const { submissions, ...rest } = q;
        return { ...rest, isCompleted };
    });
  }

  // 9. 밈 인증 (이미지 저장 + AI 검증)
  @Post('verify-meme')
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
      }
    })
  }))
  async verifyMeme(
    @UploadedFile() file: any, 
    @Body() body: { login_id: string; quest_id: string }
  ) {
    if (!file) throw new BadRequestException('Image file is missing');
    
    const user = await this.prisma.user.findUnique({ where: { loginId: body.login_id } });
    const quest = await this.prisma.quest.findUnique({ where: { id: Number(body.quest_id) } });
    
    if (!user || !quest) throw new BadRequestException('Invalid user or quest');

    // 중복 제출 방지
    const existing = await this.prisma.submission.findFirst({
        where: { userId: user.id, questId: quest.id, status: 'APPROVED' }
    });
    if (existing) throw new BadRequestException("이미 완료한 퀘스트입니다.");

    const imageBuffer = readFileSync(file.path);
    const aiResult = await this.aiService.verifyMemeImage(imageBuffer, quest.title);

    await this.prisma.submission.create({
      data: {
        userId: user.id,
        questId: quest.id,
        imageUrl: `/uploads/${file.filename}`,
        status: aiResult.isPass ? 'APPROVED' : 'REJECTED',
        aiScore: aiResult.score,
        earnedPoints: aiResult.isPass ? quest.rewardPoints : 0
      }
    });

    if (aiResult.isPass) {
      await this.usersService.addPoints(body.login_id, quest.rewardPoints);
    }

    return { 
        ...aiResult, 
        imageUrl: `/uploads/${file.filename}` 
    };
  }

  // 10. 갤러리 목록 조회 (일반 퀘스트만, 좋아요/댓글 포함)
  @Get('gallery')
  async getGallery(@Query('login_id') loginId: string) {
    const submissions = await this.prisma.submission.findMany({
      where: { status: 'APPROVED', quest: { category: 'NORMAL' } },
      orderBy: { submittedAt: 'desc' },
      include: { 
        user: { select: { nickname: true } },
        quest: { select: { title: true } },
        likes: true, 
        comments: { include: { user: { select: { nickname: true } } } } 
      }
    });

    const user = loginId ? await this.prisma.user.findUnique({ where: { loginId } }) : null;
    
    return submissions.map(sub => ({
      ...sub,
      likeCount: sub.likes.length,
      isLiked: user ? sub.likes.some(l => l.userId === user.id) : false,
      likes: undefined 
    }));
  }

  // 11. 좋아요 토글
  @Post('like-image')
  async likeImage(@Body() body: { login_id: string; submission_id: number }) {
    return this.usersService.toggleLike(body.login_id, body.submission_id);
  }

  // 댓글 작성
  @Post('comment')
  async addComment(@Body() body: { login_id: string; submission_id: number; content: string }) {
    return this.usersService.addComment(body.login_id, body.submission_id, body.content);
  }

  // 12. SNS 퀘스트 인증 (유튜브 통계 + AI 검증 + 포인트 내역 저장)
  @Post('submit-social')
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `sns-${uniqueSuffix}${extname(file.originalname)}`);
      }
    })
  }))
  async submitSocial(
    @UploadedFile() file: any,
    @Body() body: { login_id: string; platform: string; sns_url: string }
  ) {
    if (!file) throw new BadRequestException('Screenshot missing');
    if (!body.sns_url) throw new BadRequestException('SNS URL is missing');

    const existing = await this.prisma.submission.findUnique({ where: { snsUrl: body.sns_url } });
    if (existing) throw new BadRequestException('이미 제출된 게시물 URL입니다.');

    const user = await this.prisma.user.findUnique({ where: { loginId: body.login_id } });
    if (!user) throw new BadRequestException('User not found');

    let isPass = false;
    let reason = "";
    let finalStatus = "REJECTED";
    
    const BASE_REWARD = 300;
    let totalReward = 0;
    let bonusDetail = "";
    let currentViews = 0;
    let currentLikes = 0;

    // 유튜브 URL이면 API 조회
    if (body.platform === 'YouTube' || body.sns_url.includes('youtu')) {
        try {
            const stats = await this.youtubeService.getVideoStats(body.sns_url);
            console.log(`📊 YouTube Stats: View ${stats.viewCount}, Like ${stats.likeCount}`);
            
            currentViews = stats.viewCount;
            currentLikes = stats.likeCount;

            if (stats.viewCount >= 100) {
                isPass = true;
                finalStatus = "APPROVED";
                const viewBonus = Math.floor(stats.viewCount * 0.5);
                const likeBonus = stats.likeCount * 10;
                totalReward = BASE_REWARD + viewBonus + likeBonus;
                reason = `조회수(${stats.viewCount}) 달성! 추가 보너스 지급됨.`;
                bonusDetail = `기본(${BASE_REWARD}) + 조회수보너스(${viewBonus}) + 좋아요보너스(${likeBonus})`;
            }
        } catch (e) {
            console.error("유튜브 조회 실패, AI 검사로 대체");
        }
    }

    if (!isPass) {
        const imageBuffer = readFileSync(file.path);
        const aiResult = await this.aiService.verifySocialPost(imageBuffer, user.userCode, body.platform);
        isPass = aiResult.isPass;
        reason = aiResult.reason;
        finalStatus = isPass ? "APPROVED" : "REJECTED";
        if (isPass) {
            totalReward = BASE_REWARD;
            bonusDetail = "기본 보상 지급";
        }
    }

    await this.prisma.submission.create({
      data: {
        userId: user.id,
        questId: 1, 
        imageUrl: `/uploads/${file.filename}`,
        status: finalStatus,
        aiScore: 0,
        snsUrl: body.sns_url,
        lastViewCount: currentViews,
        lastLikeCount: currentLikes,
        earnedPoints: (isPass && totalReward > 0) ? totalReward : 0
      }
    });

    if (isPass && totalReward > 0) {
      await this.usersService.addPoints(body.login_id, totalReward);
    }

    return { 
      status: isPass ? 'success' : 'fail',
      reason: reason,
      reward: totalReward,
      bonusDetail: bonusDetail 
    };
  }

  // 13. 이벤트 퀘스트 작품 제출 (자동 생성 포함)
  @Post('submit-event')
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `event-${uniqueSuffix}${extname(file.originalname)}`);
      }
    })
  }))
  async submitEvent(
    @UploadedFile() file: any,
    @Body() body: { login_id: string; event_id: string }
  ) {
    if (!file) throw new BadRequestException('File missing');

    const user = await this.prisma.user.findUnique({ where: { loginId: body.login_id } });
    if (!user) throw new BadRequestException('User not found');

    let realQuestId = Number(body.event_id);
    
    if (realQuestId === 101 || realQuestId === 102) {
        const eventTitle = realQuestId === 101 ? "슬픈 개구리 (페페)" : "도지 투 더 문";
        let quest = await this.prisma.quest.findFirst({ where: { title: { contains: eventTitle } } });

        if (!quest) {
            quest = await this.prisma.quest.create({
                data: {
                    title: eventTitle + " 챌린지",
                    content: "이벤트 퀘스트",
                    targetViews: 0,
                    rewardPoints: 500,
                    creatorId: null,
                    category: 'EVENT'
                }
            });
        } else {
            if (quest.category !== 'EVENT') {
                await this.prisma.quest.update({ where: { id: quest.id }, data: { category: 'EVENT' } });
            }
        }
        realQuestId = quest.id;
    }

    await this.prisma.submission.create({
      data: {
        userId: user.id,
        questId: realQuestId, 
        imageUrl: `/uploads/${file.filename}`,
        status: 'APPROVED',
        aiScore: 0,
        earnedPoints: 0
      }
    });

    return { status: 'success', message: '이벤트 참여 완료!' };
  }

  // 14. 이벤트 참가작 조회
  @Get('event-entries')
  async getEventEntries(@Query('event_id') eventId: string) {
    let realQuestId = Number(eventId);
    if (realQuestId === 101 || realQuestId === 102) {
        const eventTitle = realQuestId === 101 ? "슬픈 개구리 (페페)" : "도지 투 더 문";
        const quest = await this.prisma.quest.findFirst({ where: { title: { contains: eventTitle } } });
        if (!quest) return [];
        realQuestId = quest.id;
    }

    const submissions = await this.prisma.submission.findMany({
      where: { questId: realQuestId, status: 'APPROVED' },
      orderBy: { submittedAt: 'desc' },
      include: { user: { select: { nickname: true } }, likes: true }
    });

    return submissions.map(sub => ({ ...sub, likes: sub.likes.length })).sort((a, b) => b.likes - a.likes);
  }

  // 15. 내 정보 수정
  @Post('update-profile')
  async updateProfile(@Body() body: { login_id: string; nickname?: string; wallet_address?: string; password?: string }) {
    return this.usersService.updateProfile(body.login_id, body.nickname, body.wallet_address, body.password);
  }

  // 16. 포인트 획득 내역 조회 (Null 체크 추가)
  @Get('point-history')
  async getPointHistory(@Query('login_id') loginId: string) {
    const user = await this.prisma.user.findUnique({ where: { loginId } });
    if (!user) return { aiTotal: 0, snsList: [], eventList: [] };

    const submissions = await this.prisma.submission.findMany({
      where: { userId: user.id, status: 'APPROVED' },
      include: { quest: true },
      orderBy: { submittedAt: 'desc' }
    });

    const aiSubmissions = submissions.filter(s => s.quest.category === 'NORMAL' && !s.snsUrl);
    const aiTotal = aiSubmissions.reduce((sum, s) => sum + s.earnedPoints, 0);

    const snsList = submissions
      .filter(s => s.snsUrl)
      .map(s => ({
        id: s.id,
        platform: s.snsUrl?.includes('youtu') ? 'YouTube' : 'SNS',
        url: s.snsUrl,
        earnedPoints: s.earnedPoints,
        views: s.lastViewCount,
        likes: s.lastLikeCount,
        date: s.submittedAt
      }));

    const eventList = submissions
      .filter(s => s.quest.category === 'EVENT')
      .map(s => ({
        id: s.id,
        title: s.quest.title,
        earnedPoints: s.earnedPoints,
        date: s.submittedAt
      }));

    return { aiTotal, snsList, eventList };
  }

  // 17. 이벤트 랭킹 정산 및 보상 지급 (관리자용)
  @Post('reward-event-winners')
  async rewardEventWinners(@Body() body: { event_id: string }) {
    const questId = Number(body.event_id);

    const top3 = await this.prisma.submission.findMany({
      where: { questId, status: 'APPROVED' },
      orderBy: { likes: { _count: 'desc' } },
      take: 3,
      include: { user: true }
    });

    if (top3.length === 0) return { message: "참여자가 없습니다." };

    const prizes = [5000, 3000, 1000]; 
    // [수정] results 배열의 타입을 string[]으로 명시 (TS 에러 해결)
    const results: string[] = [];

    for (let i = 0; i < top3.length; i++) {
      const winner = top3[i];
      const prize = prizes[i];
      
      await this.usersService.addPoints(winner.user.loginId, prize);
      
      await this.prisma.submission.update({
        where: { id: winner.id },
        data: { earnedPoints: { increment: prize } }
      });

      results.push(`${i + 1}등: ${winner.user.nickname} (+${prize}P)`);
    }

    return { status: 'success', results };
  }
}