import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  // 프론트엔드 주소만 허용 (FRONTEND_URL 미설정 시 CRA 개발 서버)
  app.enableCors({
    origin: (config.get<string>('FRONTEND_URL') || 'http://localhost:3001')
      .split(',')
      .map((o) => o.trim()),
  });
  await app.listen(config.get<string>('PORT') ?? 3000);
}
void bootstrap();
