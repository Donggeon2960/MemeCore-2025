import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // [여기 추가!] 프론트엔드(React)의 접속을 허용합니다.
  app.enableCors();

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();