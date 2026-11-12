import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma.service';
import { extractVideoId, snsBonus, YoutubeService } from '../youtube.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private prisma: PrismaService,
    private youtubeService: YoutubeService,
    private usersService: UsersService,
  ) {}

  // 매주 월요일 00:00 주간 랭킹 초기화
  @Cron('0 0 * * 1', { timeZone: 'Asia/Seoul' })
  async handleWeeklyReset() {
    await this.usersService.resetWeeklyRanking();
    this.logger.log('🔄 주간 랭킹 초기화 완료');
  }

  // 매일 자정: 유튜브 조회수/좋아요 증가분만큼 보너스 지급
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, { timeZone: 'Asia/Seoul' })
  async handleDailyYoutubeReward() {
    this.logger.log('🕛 자정 정산 시작: 유튜브 조회수 보너스 계산 중...');
    const submissions = await this.prisma.submission.findMany({
      where: {
        status: 'APPROVED',
        snsUrl: { contains: 'youtu' }, // 예전 데이터는 원본 URL 형태
      },
    });

    let paid = 0;
    for (const sub of submissions) {
      const videoId = extractVideoId(sub.snsUrl ?? '');
      if (!videoId) continue;
      try {
        const stats = await this.youtubeService.getVideoStats(videoId);
        // 조회수가 줄어든 경우(집계 보정 등)는 기준값을 올리지 않아 이중 지급을 막는다
        const viewCount = Math.max(stats.viewCount, sub.lastViewCount);
        const likeCount = Math.max(stats.likeCount, sub.lastLikeCount);
        const bonus = snsBonus(
          viewCount - sub.lastViewCount,
          likeCount - sub.lastLikeCount,
        );

        await this.prisma.$transaction(async (tx) => {
          await tx.submission.update({
            where: { id: sub.id },
            data: {
              lastViewCount: viewCount,
              lastLikeCount: likeCount,
              earnedPoints: { increment: bonus },
            },
          });
          if (bonus > 0)
            await this.usersService.addPoints(
              sub.userId,
              bonus,
              'SNS_BONUS',
              sub.id,
              tx,
            );
        });
        if (bonus > 0) {
          paid += bonus;
          this.logger.log(
            `💰 submission ${sub.id}: +${bonus}P (조회수 ${viewCount}, 좋아요 ${likeCount})`,
          );
        }
      } catch (error) {
        // 에러 나도 다음 사람 정산은 계속 진행
        this.logger.error(
          `Failed to update stats for submission ${sub.id}: ${(error as Error).message}`,
        );
      }
    }
    this.logger.log(
      `✅ 자정 정산 완료: ${submissions.length}건 확인, 총 ${paid}P 지급`,
    );
  }
}
