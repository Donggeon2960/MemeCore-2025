import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { AiModule } from '../ai/ai.module';
import { YoutubeService } from '../youtube.service';
import { AuthController } from '../../auth';

@Module({
  imports: [BlockchainModule, AiModule],
  controllers: [AuthController, UsersController],
  providers: [UsersService, YoutubeService],
  // TasksModule 에서 사용
  exports: [UsersService, YoutubeService],
})
export class UsersModule {}
