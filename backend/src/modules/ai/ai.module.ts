import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiService } from './ai.service';

@Module({
  imports: [ConfigModule], // 환경변수 사용을 위해
  providers: [AiService],  // 이 모듈 안에서 AiService를 씀
  exports: [AiService],    // [중요] 다른 모듈(AppModule)에서도 AiService를 쓸 수 있게 공개!
})
export class AiModule {}