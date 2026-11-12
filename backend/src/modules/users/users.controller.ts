import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { Prisma } from '@prisma/client';
import type { User } from '@prisma/client';

import {
  EVENT_PRIZES,
  isEventOpen,
  publicUser,
  str,
  UsersService,
} from './users.service';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '../../prisma.service';
import {
  extractVideoId,
  normalizeSnsUrl,
  SNS_BASE_REWARD,
  SNS_BONUS_MIN_VIEWS,
  snsBonus,
  YoutubeService,
} from '../youtube.service';
import { AdminGuard, AuthGuard, CurrentUser } from '../../auth';
import { imageUpload, readImage, saveImage } from '../../uploads';

const PLATFORMS = ['YouTube', 'Instagram', 'TikTok', 'X'];
const WEEKLY_QUEST_LIMIT = 3;
// AI 호출(유료)이 걸린 엔드포인트: IP당 분당 5회
const AI_THROTTLE = { default: { limit: 5, ttl: 60_000 } };

const isUniqueViolation = (e: unknown) =>
  e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002';

@Controller('api')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly aiService: AiService,
    private readonly prisma: PrismaService,
    private readonly youtubeService: YoutubeService,
  ) {}

  @Post('swap-to-token')
  swap(@CurrentUser() user: User, @Body() body: { amount?: unknown }) {
    return this.usersService.swapToToken(user, body.amount);
  }

  @Get('rankings')
  getRankings() {
    return this.usersService.getTopRankings();
  }

  @Post('reset-ranking')
  @UseGuards(AdminGuard)
  resetRanking() {
    return this.usersService.resetWeeklyRanking();
  }

  @Get('my-rank')
  getMyRank(@CurrentUser() user: User) {
    return this.usersService.getMyRank(user);
  }

  // 퀘스트 생성 (주간 3회 제한)
  @Post('generate-quest')
  @Throttle(AI_THROTTLE)
  async generateQuest(@CurrentUser() user: User) {
    const oneWeekAgo = new Date(Date.now() - 7 * 86_400_000);
    const count = await this.prisma.quest.count({
      where: {
        creatorId: user.id,
        category: 'NORMAL',
        createdAt: { gte: oneWeekAgo },
      },
    });
    if (count >= WEEKLY_QUEST_LIMIT)
      throw new BadRequestException(
        `주간 퀘스트 생성 한도(${WEEKLY_QUEST_LIMIT}회)를 초과했습니다.`,
      );

    const aiQuest = await this.aiService.generateDailyQuest();
    return this.prisma.quest.create({
      data: { ...aiQuest, creatorId: user.id, category: 'NORMAL' },
    });
  }

  @Get('my-quests')
  async getMyQuests(@CurrentUser() user: User) {
    const quests = await this.prisma.quest.findMany({
      where: { creatorId: user.id, category: 'NORMAL' },
      orderBy: { createdAt: 'desc' },
    });
    return quests.map(({ completedAt, ...q }) => ({
      ...q,
      isCompleted: !!completedAt,
    }));
  }

  // 밈 인증 (AI 검증 통과 시 이미지 저장 + 보상)
  @Post('verify-meme')
  @Throttle(AI_THROTTLE)
  @UseInterceptors(FileInterceptor('image', imageUpload))
  async verifyMeme(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { quest_id?: unknown },
  ) {
    const img = readImage(file);
    const quest = await this.prisma.quest.findUnique({
      where: { id: Number(body.quest_id) || 0 },
    });
    // 내가 만든 일반 퀘스트만 제출 가능
    if (!quest || quest.category !== 'NORMAL' || quest.creatorId !== user.id)
      throw new BadRequestException('존재하지 않는 퀘스트입니다.');
    if (quest.completedAt)
      throw new BadRequestException('이미 완료한 퀘스트입니다.');

    const aiResult = await this.aiService.verifyMemeImage(
      img.buffer,
      img.mime,
      quest.title,
    );
    if (!aiResult.isPass) return aiResult; // 불합격 이미지는 저장하지 않음

    const imageUrl = await saveImage(img, 'meme');
    // completedAt 조건부 UPDATE: 동시에 두 번 제출해도 보상은 한 번만
    await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.quest.updateMany({
        where: { id: quest.id, completedAt: null },
        data: { completedAt: new Date() },
      });
      if (count === 0)
        throw new BadRequestException('이미 완료한 퀘스트입니다.');
      const sub = await tx.submission.create({
        data: {
          userId: user.id,
          questId: quest.id,
          imageUrl,
          status: 'APPROVED',
          aiScore: aiResult.score,
          earnedPoints: quest.rewardPoints,
        },
      });
      await this.usersService.addPoints(
        user.id,
        quest.rewardPoints,
        'AI_QUEST',
        sub.id,
        tx,
      );
    });
    return { ...aiResult, imageUrl, reward: quest.rewardPoints };
  }

  // 갤러리 (AI 퀘스트 통과작)
  @Get('gallery')
  async getGallery(@CurrentUser() user: User, @Query('page') pageRaw?: string) {
    const page = Math.max(1, Number(pageRaw) || 1);
    const submissions = await this.prisma.submission.findMany({
      where: {
        status: 'APPROVED',
        snsUrl: null,
        quest: { category: 'NORMAL' },
      },
      orderBy: { submittedAt: 'desc' },
      take: 30,
      skip: (page - 1) * 30,
      include: {
        user: { select: { nickname: true } },
        quest: { select: { title: true } },
        likes: { select: { userId: true } },
        comments: {
          include: { user: { select: { nickname: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    return submissions.map(({ likes, ...sub }) => ({
      ...sub,
      likeCount: likes.length,
      isLiked: likes.some((l) => l.userId === user.id),
    }));
  }

  @Post('like-image')
  likeImage(
    @CurrentUser() user: User,
    @Body() body: { submission_id?: unknown },
  ) {
    return this.usersService.toggleLike(user, body.submission_id);
  }

  @Post('comment')
  addComment(
    @CurrentUser() user: User,
    @Body() body: { submission_id?: unknown; content?: unknown },
  ) {
    return this.usersService.addComment(user, body.submission_id, body.content);
  }

  /**
   * SNS 바이럴 인증
   * - YouTube: 영상 설명란에 내 userCode 가 있어야 함 (본인 영상 확인). 조회수 100 이상이면 보너스
   * - 그 외: 스크린샷 OCR 로 userCode 확인 → 기본 보상
   */
  @Post('submit-social')
  @Throttle(AI_THROTTLE)
  @UseInterceptors(FileInterceptor('image', imageUpload))
  async submitSocial(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { platform?: unknown; sns_url?: unknown },
  ) {
    const platform = str(body.platform, '플랫폼', 20);
    if (!PLATFORMS.includes(platform))
      throw new BadRequestException('지원하지 않는 플랫폼입니다.');
    const rawUrl = str(body.sns_url, '게시물 URL', 500);
    const img = readImage(file);

    let snsUrl: string;
    let reward = SNS_BASE_REWARD;
    let views = 0;
    let likes = 0;
    let bonusDetail = '기본 보상';

    if (platform === 'YouTube') {
      const videoId = extractVideoId(rawUrl);
      if (!videoId)
        throw new BadRequestException('올바른 유튜브 영상 URL이 아닙니다.');
      snsUrl = `https://youtu.be/${videoId}`; // 같은 영상의 다른 URL 형태로 중복 제출 방지
      await this.assertNewSnsUrl(snsUrl);
      const stats = await this.youtubeService.getVideoStats(videoId);
      if (!stats.description.includes(user.userCode))
        throw new BadRequestException(
          `영상 설명란에 내 코드(${user.userCode})를 적은 뒤 다시 제출해주세요.`,
        );
      views = stats.viewCount;
      likes = stats.likeCount;
      if (views >= SNS_BONUS_MIN_VIEWS) {
        const bonus = snsBonus(views, likes);
        reward += bonus;
        bonusDetail = `기본(${SNS_BASE_REWARD}) + 조회수·좋아요 보너스(${bonus})`;
      }
    } else {
      snsUrl = normalizeSnsUrl(platform, rawUrl);
      await this.assertNewSnsUrl(snsUrl);
      const aiResult = await this.aiService.verifySocialPost(
        img.buffer,
        img.mime,
        user.userCode,
        platform,
      );
      if (!aiResult.isPass) return { status: 'fail', reason: aiResult.reason };
    }

    const imageUrl = await saveImage(img, 'sns');
    const snsQuest = await this.prisma.quest.findFirstOrThrow({
      where: { category: 'SNS' },
    });
    try {
      await this.prisma.$transaction(async (tx) => {
        const sub = await tx.submission.create({
          data: {
            userId: user.id,
            questId: snsQuest.id,
            imageUrl,
            status: 'APPROVED',
            snsUrl,
            lastViewCount: views,
            lastLikeCount: likes,
            earnedPoints: reward,
          },
        });
        await this.usersService.addPoints(user.id, reward, 'SNS', sub.id, tx);
      });
    } catch (e) {
      // 동시에 같은 URL 이 들어와도 DB unique 제약이 최종 방어
      if (isUniqueViolation(e))
        throw new BadRequestException('이미 제출된 게시물 URL입니다.');
      throw e;
    }
    return { status: 'success', reason: '인증 완료!', reward, bonusDetail };
  }

  private async assertNewSnsUrl(snsUrl: string) {
    if (await this.prisma.submission.findUnique({ where: { snsUrl } }))
      throw new BadRequestException('이미 제출된 게시물 URL입니다.');
  }

  // 진행/종료 이벤트 목록
  @Get('events')
  async getEvents() {
    const events = await this.prisma.quest.findMany({
      where: { category: 'EVENT' },
      orderBy: { endsAt: 'desc' },
      include: { _count: { select: { submissions: true } } },
    });
    return events.map(({ _count, ...e }) => ({
      ...e,
      entryCount: _count.submissions,
      isOpen: isEventOpen(e),
      prizes: EVENT_PRIZES,
    }));
  }

  // 이벤트 작품 제출: 마감 전, 1인 1작품
  @Post('submit-event')
  @UseInterceptors(FileInterceptor('image', imageUpload))
  async submitEvent(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { event_id?: unknown },
  ) {
    const img = readImage(file);
    const event = await this.eventOrThrow(body.event_id);
    if (!isEventOpen(event))
      throw new BadRequestException('마감된 이벤트입니다.');
    if (
      await this.prisma.submission.findFirst({
        where: { questId: event.id, userId: user.id },
      })
    )
      throw new BadRequestException('이벤트당 한 작품만 출품할 수 있습니다.');

    const imageUrl = await saveImage(img, 'event');
    await this.prisma.submission.create({
      data: {
        userId: user.id,
        questId: event.id,
        imageUrl,
        status: 'APPROVED',
      },
    });
    return { status: 'success', message: '이벤트 참여 완료!' };
  }

  @Get('event-entries')
  async getEventEntries(
    @CurrentUser() user: User,
    @Query('event_id') eventId: string,
  ) {
    const event = await this.eventOrThrow(eventId);
    const subs = await this.prisma.submission.findMany({
      where: { questId: event.id, status: 'APPROVED' },
      orderBy: [{ likes: { _count: 'desc' } }, { submittedAt: 'asc' }], // 정산과 같은 순서
      include: {
        user: { select: { nickname: true } },
        likes: { select: { userId: true } },
      },
    });
    return subs.map(({ likes, ...s }) => ({
      ...s,
      likes: likes.length,
      isLiked: likes.some((l) => l.userId === user.id),
    }));
  }

  private async eventOrThrow(id: unknown) {
    const event = await this.prisma.quest.findUnique({
      where: { id: Number(id) || 0 },
    });
    if (!event || event.category !== 'EVENT')
      throw new BadRequestException('존재하지 않는 이벤트입니다.');
    return event;
  }

  @Post('update-profile')
  updateProfile(
    @CurrentUser() user: User,
    @Body()
    body: {
      nickname?: unknown;
      wallet_address?: unknown;
      password?: unknown;
      current_password?: unknown;
    },
  ) {
    return this.usersService.updateProfile(user, body);
  }

  // 포인트 내역 (원장 기반 + 카테고리별 요약)
  @Get('point-history')
  async getPointHistory(@CurrentUser() user: User) {
    const [ledger, submissions] = await Promise.all([
      this.prisma.pointLedger.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      this.prisma.submission.findMany({
        where: { userId: user.id, status: 'APPROVED' },
        include: { quest: true },
        orderBy: { submittedAt: 'desc' },
      }),
    ]);
    const aiTotal = submissions
      .filter((s) => s.quest.category === 'NORMAL' && !s.snsUrl)
      .reduce((sum, s) => sum + s.earnedPoints, 0);
    const snsList = submissions
      .filter((s) => s.snsUrl)
      .map((s) => ({
        id: s.id,
        platform: s.snsUrl?.includes('youtu') ? 'YouTube' : 'SNS',
        url: s.snsUrl,
        earnedPoints: s.earnedPoints,
        views: s.lastViewCount,
        likes: s.lastLikeCount,
        date: s.submittedAt,
      }));
    const eventList = submissions
      .filter((s) => s.quest.category === 'EVENT')
      .map((s) => ({
        id: s.id,
        title: s.quest.title,
        earnedPoints: s.earnedPoints,
        date: s.submittedAt,
      }));
    return { aiTotal, snsList, eventList, ledger, user: publicUser(user) };
  }

  // 이벤트 정산 (관리자): 마감 후 1회만, 좋아요 순 Top 3
  @Post('reward-event-winners')
  @UseGuards(AdminGuard)
  async rewardEventWinners(@Body() body: { event_id?: unknown }) {
    const event = await this.eventOrThrow(body.event_id);
    if (event.settledAt)
      throw new BadRequestException('이미 정산된 이벤트입니다.');
    if (event.endsAt && event.endsAt > new Date())
      throw new BadRequestException('마감 후에 정산할 수 있습니다.');

    return this.prisma.$transaction(async (tx) => {
      // settledAt 조건부 UPDATE: 동시에 눌러도 한 번만 지급
      const { count } = await tx.quest.updateMany({
        where: { id: event.id, settledAt: null },
        data: { settledAt: new Date() },
      });
      if (count === 0)
        throw new BadRequestException('이미 정산된 이벤트입니다.');

      const top3 = await tx.submission.findMany({
        where: { questId: event.id, status: 'APPROVED' },
        orderBy: [{ likes: { _count: 'desc' } }, { submittedAt: 'asc' }],
        take: EVENT_PRIZES.length,
        include: { user: true },
      });
      const results: string[] = [];
      for (const [i, winner] of top3.entries()) {
        await this.usersService.addPoints(
          winner.userId,
          EVENT_PRIZES[i],
          'EVENT_PRIZE',
          winner.id,
          tx,
        );
        await tx.submission.update({
          where: { id: winner.id },
          data: { earnedPoints: { increment: EVENT_PRIZES[i] } },
        });
        results.push(
          `${i + 1}등: ${winner.user.nickname} (+${EVENT_PRIZES[i]}P)`,
        );
      }
      return {
        status: 'success',
        results: results.length ? results : ['참여자가 없습니다.'],
      };
    });
  }

  // 이벤트 생성 (관리자)
  @Post('events')
  @UseGuards(AdminGuard)
  createEvent(
    @Body()
    body: {
      title?: unknown;
      description?: unknown;
      token_icon?: unknown;
      token_symbol?: unknown;
      ends_at?: unknown;
    },
  ) {
    const endsAt = new Date(str(body.ends_at, '마감일', 40));
    if (Number.isNaN(endsAt.getTime()) || endsAt <= new Date())
      throw new BadRequestException('마감일은 미래 날짜여야 합니다.');
    return this.prisma.quest.create({
      data: {
        category: 'EVENT',
        title: str(body.title, '제목', 100),
        description: str(body.description, '설명', 1000, false),
        tokenIcon: str(body.token_icon, '아이콘', 8, false) || '🏆',
        tokenSymbol: str(body.token_symbol, '심볼', 10, false) || 'MQ',
        rewardPoints: EVENT_PRIZES[0],
        endsAt,
      },
    });
  }
}
