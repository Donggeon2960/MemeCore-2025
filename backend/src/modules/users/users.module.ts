import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaService } from '../../prisma.service';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { AiModule } from '../ai/ai.module'; // [중요] AI 모듈 추가

@Module({
  imports: [BlockchainModule, AiModule], // 여기에 AiModule 꼭 있어야 함!
  controllers: [UsersController],
  providers: [UsersService, PrismaService],
})
export class UsersModule {}