import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { UsersModule } from '../users/users.module'; // UsersService 사용을 위해
import { PrismaService } from '../../prisma.service';
import { YoutubeService } from '../youtube.service'; // YoutubeService 사용

@Module({
  imports: [UsersModule], 
  providers: [TasksService, PrismaService, YoutubeService],
})
export class TasksModule {}