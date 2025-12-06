import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaService } from '../../prisma.service';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { AiModule } from '../ai/ai.module';
import { YoutubeService } from '../youtube.service';

@Module({
  imports: [BlockchainModule, AiModule],
  controllers: [UsersController],
  providers: [UsersService, PrismaService, YoutubeService],
  
  // ▼ [핵심 수정] 이 줄을 꼭 추가해야 다른 모듈(TasksModule)에서 UsersService를 쓸 수 있습니다!
  exports: [UsersService], 
})
export class UsersModule {}