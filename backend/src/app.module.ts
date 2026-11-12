import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma.service';
import { UPLOAD_DIR } from './uploads';
import { UsersModule } from './modules/users/users.module';
import { TasksModule } from './modules/tasks/tasks.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_SECRET');
        if (!secret || secret.length < 32)
          throw new Error(
            'JWT_SECRET 환경변수(32자 이상)를 설정해주세요. (.env.example 참고)',
          );
        return { secret, signOptions: { expiresIn: '7d' } };
      },
    }),
    // 기본: IP당 분당 120회 (로그인 무차별 대입 등 방어)
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    ServeStaticModule.forRoot({
      rootPath: UPLOAD_DIR,
      serveRoot: '/uploads',
      serveStaticOptions: {
        index: false,
        // 업로드 파일이 HTML/스크립트로 해석되지 않도록
        setHeaders: (res: Response) =>
          res.setHeader('X-Content-Type-Options', 'nosniff'),
      },
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    UsersModule,
    TasksModule,
  ],
  controllers: [AppController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
