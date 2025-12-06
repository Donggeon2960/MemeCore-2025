import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ScheduleModule } from '@nestjs/schedule'; // [추가]
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BlockchainModule } from './modules/blockchain/blockchain.module';
import { AiModule } from './modules/ai/ai.module';
import { UsersModule } from './modules/users/users.module';
// 나중에 만들 TasksModule도 import 해야 함 (아래에서 설명)
import { TasksModule } from './modules/tasks/tasks.module'; 

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    ScheduleModule.forRoot(), // [추가] 스케줄러 활성화
    BlockchainModule,
    AiModule,
    UsersModule,
    TasksModule, // [추가]
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}