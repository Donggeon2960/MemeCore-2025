import { Global, Injectable, Module, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}

// 앱 전체에서 PrismaService 하나(DB 커넥션 풀 하나)만 쓰도록 전역 모듈로 제공
@Global()
@Module({ providers: [PrismaService], exports: [PrismaService] })
export class PrismaModule {}
