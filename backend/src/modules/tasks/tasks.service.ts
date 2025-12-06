import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma.service';
import { YoutubeService } from '../youtube.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private prisma: PrismaService,
    private youtubeService: YoutubeService,
    private usersService: UsersService,
  ) {}

  // 매일 자정(00:00:00)에 실행
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyYoutubeReward() {
    this.logger.log('🕛 자정 정산 시작: 유튜브 조회수 보너스 계산 중...');

    // 1. 유튜브 링크가 있는 모든 승인된 제출물 가져오기
    const submissions = await this.prisma.submission.findMany({
      where: {
        status: 'APPROVED',
        snsUrl: { contains: 'youtu' } // 유튜브 링크만 필터링
      },
      include: { user: true } // 유저 정보도 같이 가져옴 (로그인ID 필요)
    });

    for (const sub of submissions) {
      if (!sub.snsUrl) continue;

      try {
        // 2. 현재 유튜브 통계 가져오기
        const stats = await this.youtubeService.getVideoStats(sub.snsUrl);
        
        // 3. 증가분 계산 (현재값 - 어제값)
        const viewDiff = stats.viewCount - sub.lastViewCount;
        const likeDiff = stats.likeCount - sub.lastLikeCount;

        // 증가분이 없으면 스킵
        if (viewDiff <= 0 && likeDiff <= 0) continue;

        // 4. 보너스 포인트 계산 (조회수당 0.5점, 좋아요당 10점)
        // 음수일 경우(조회수 감소 등 오류) 0 처리
        const viewBonus = Math.max(0, Math.floor(viewDiff * 0.5));
        const likeBonus = Math.max(0, likeDiff * 10);
        const totalBonus = viewBonus + likeBonus;

        // ... (상단 로직 동일)
        if (totalBonus > 0) {
          await this.usersService.addPoints(sub.user.loginId, totalBonus);
          
          // [NEW] Submission 기록에도 누적 포인트 업데이트
          await this.prisma.submission.update({
            where: { id: sub.id },
            data: {
              earnedPoints: { increment: totalBonus }, // 기존 점수에 더하기
              lastViewCount: stats.viewCount,
              lastLikeCount: stats.likeCount
            }
          });
          
          this.logger.log(`...`);
        } else {
           // 보너스 없어도 조회수 최신화는 해야 함
           await this.prisma.submission.update({
             where: { id: sub.id },
             data: { lastViewCount: stats.viewCount, lastLikeCount: stats.likeCount }
           });
        }
// ...

        // 6. DB 업데이트 (현재 값을 '마지막 값'으로 저장)
        await this.prisma.submission.update({
          where: { id: sub.id },
          data: {
            lastViewCount: stats.viewCount,
            lastLikeCount: stats.likeCount
          }
        });

      } catch (error) {
        this.logger.error(`Failed to update stats for submission ${sub.id}: ${error.message}`);
        // 에러 나도 다음 사람 정산은 계속 진행
        continue;
      }
    }
    
    this.logger.log('✅ 자정 정산 완료.');
  }
}