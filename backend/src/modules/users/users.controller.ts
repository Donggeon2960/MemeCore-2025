import { Controller, Post, Body, Get, Query, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { readFileSync } from 'fs';

import { UsersService } from './users.service';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '../../prisma.service';

@Controller('api')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly aiService: AiService,
    private readonly prisma: PrismaService,
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
  
  // 4. 포인트 받기 (치트)
  @Post('cheat-points')
  async cheat(@Body() body: { login_id: string; amount: string | number }) {
      return this.usersService.addPoints(body.login_id, Number(body.amount));
  }

  // 5. 주간 랭킹 조회
  @Get('rankings')
  async getRankings() {
    return this.usersService.getTopRankings();
  }

  // 주간 랭킹 초기화
  @Post('reset-ranking')
  async resetRanking() {
    return this.usersService.resetWeeklyRanking();
  }

  // 6. 내 등수 확인
  @Get('my-rank')
  async getMyRank(@Query('login_id') loginId: string) {
    return this.usersService.getMyRank(loginId);
  }

  // 7. 퀘스트 생성
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

    if (count >= 3) throw new BadRequestException('주간 퀘스트 생성 한도(3회)를 초과했습니다.');

    const aiQuest = await this.aiService.generateDailyQuest();
    
    const savedQuest = await this.prisma.quest.create({
      data: {
        creatorId: user.id,
        title: aiQuest.title,
        content: aiQuest.content,
        targetViews: aiQuest.targetViews,
        rewardPoints: aiQuest.rewardPoints,
        category: 'NORMAL' // 일반 퀘스트 명시
      }
    });

    return savedQuest;
  }

  // 8. 나의 퀘스트 목록 조회 (수정됨: 완료 여부(isCompleted) 플래그 추가)
  @Get('my-quests')
  async getMyQuests(@Query('login_id') loginId: string) {
    const user = await this.prisma.user.findUnique({ where: { loginId } });
    if (!user) return [];
    
    // 1. 모든 일반 퀘스트 조회
    const quests = await this.prisma.quest.findMany({
      where: { 
          creatorId: user.id,
          category: 'NORMAL' 
      },
      orderBy: { createdAt: 'desc' },
      include: { submissions: true } // 제출 기록 확인용
    });

    // 2. [핵심] 숨기는 대신 'isCompleted' 속성을 추가해서 반환
    return quests.map(q => {
        const isCompleted = q.submissions.some(sub => 
            sub.userId === user.id && sub.status === 'APPROVED'
        );

        const { submissions, ...rest } = q; // 무거운 submissions 배열은 빼고 보냄
        return { 
            ...rest, 
            isCompleted // true 또는 false
        };
    });
  }

  // 9. 밈 인증 (수정됨: 중복 제출 방지 로직 추가)
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

    // [핵심] 이미 깬 퀘스트인지 확인
    const existingSubmission = await this.prisma.submission.findFirst({
        where: {
            userId: user.id,
            questId: quest.id,
            status: 'APPROVED'
        }
    });

    if (existingSubmission) {
        throw new BadRequestException("이미 완료한 퀘스트입니다! 목록에서 사라져야 정상입니다.");
    }

    const imageBuffer = readFileSync(file.path);
    const aiResult = await this.aiService.verifyMemeImage(imageBuffer, quest.title);

    await this.prisma.submission.create({
      data: {
        userId: user.id,
        questId: quest.id,
        imageUrl: `/uploads/${file.filename}`,
        status: aiResult.isPass ? 'APPROVED' : 'REJECTED',
        aiScore: aiResult.score,
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

  // 10. 갤러리 목록 조회 (이벤트 제외, 일반 밈만)
  @Get('gallery')
  async getGallery(@Query('login_id') loginId: string) {
    const submissions = await this.prisma.submission.findMany({
      where: { 
        status: 'APPROVED',
        // [핵심] 이벤트 퀘스트(EVENT)는 제외하고 NORMAL만 가져옴
        quest: { category: 'NORMAL' }
      },
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

  // 12. SNS 퀘스트 인증
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

    const imageBuffer = readFileSync(file.path);
    const aiResult = await this.aiService.verifySocialPost(imageBuffer, user.userCode, body.platform);

    await this.prisma.submission.create({
      data: {
        userId: user.id,
        questId: 1, 
        imageUrl: `/uploads/${file.filename}`,
        status: aiResult.isPass ? 'APPROVED' : 'REJECTED',
        aiScore: 0,
        snsUrl: body.sns_url
      }
    });

    if (aiResult.isPass) {
      await this.usersService.addPoints(body.login_id, 300);
    }

    return { 
      status: aiResult.isPass ? 'success' : 'fail',
      reason: aiResult.reason,
      reward: aiResult.isPass ? 300 : 0
    };
  }

  // 13. 이벤트 퀘스트 작품 제출 (생성 및 수정 로직 포함)
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
    
    // 이벤트 ID인 경우 처리
    if (realQuestId === 101 || realQuestId === 102) {
        const eventTitle = realQuestId === 101 ? "슬픈 개구리 (페페)" : "도지 투 더 문";
        
        // 이미 존재하는지 확인
        let quest = await this.prisma.quest.findFirst({ 
            where: { title: { contains: eventTitle } } 
        });

        // 없으면 생성
        if (!quest) {
            quest = await this.prisma.quest.create({
                data: {
                    title: eventTitle + " 챌린지",
                    content: "이벤트 기간 한정 공식 챌린지입니다.",
                    targetViews: 0,
                    rewardPoints: 500,
                    creatorId: null,
                    category: 'EVENT' // [중요] 카테고리 설정
                }
            });
        } else {
            // [중요] 이미 있어도 category가 'NORMAL'일 수 있으니 'EVENT'로 강제 업데이트 (기존 데이터 수정)
            if (quest.category !== 'EVENT') {
                await this.prisma.quest.update({
                    where: { id: quest.id },
                    data: { category: 'EVENT' }
                });
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
      }
    });

    return { status: 'success', message: '이벤트 참여 완료! 투표를 기다리세요.' };
  }

  // 14. 특정 이벤트의 참가작 목록 조회 (수정됨: 진짜 ID 찾기 로직 추가)
  @Get('event-entries')
  async getEventEntries(@Query('event_id') eventId: string) {
    let realQuestId = Number(eventId);

    // [핵심 수정] 조회할 때도 가짜 ID(101)를 진짜 DB ID로 변환해서 찾아야 함
    if (realQuestId === 101 || realQuestId === 102) {
        const eventTitle = realQuestId === 101 ? "슬픈 개구리 (페페)" : "도지 투 더 문";
        const quest = await this.prisma.quest.findFirst({ 
            where: { title: { contains: eventTitle } } 
        });
        
        // 퀘스트가 DB에 없으면(아직 아무도 참여 안했으면) 빈 배열 리턴
        if (!quest) return [];
        realQuestId = quest.id;
    }

    const submissions = await this.prisma.submission.findMany({
      where: { 
        questId: realQuestId, // 진짜 ID로 검색
        status: 'APPROVED' 
      },
      orderBy: { submittedAt: 'desc' },
      include: { 
        user: { select: { nickname: true } },
        likes: true 
      }
    });

    const result = submissions.map(sub => ({
      ...sub,
      likes: sub.likes.length 
    }));
    
    return result.sort((a, b) => b.likes - a.likes);
  }

  // 15. 내 정보 수정
  @Post('update-profile')
  async updateProfile(@Body() body: { login_id: string; nickname?: string; wallet_address?: string; password?: string }) {
    return this.usersService.updateProfile(body.login_id, body.nickname, body.wallet_address, body.password);
  }
}