import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static'; // 추가
import { join } from 'path'; // 추가
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BlockchainModule } from './modules/blockchain/blockchain.module';
import { AiModule } from './modules/ai/ai.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // [추가] uploads 폴더를 정적 파일로 서빙 (이미지 보기용)
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    BlockchainModule,
    AiModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}