import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
		origin: "http://localhost:3000",
		credentials: true
	});
  await app.listen(3000);
}
bootstrap();
