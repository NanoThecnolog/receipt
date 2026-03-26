import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 3133
  await app.listen(port);
  console.log("Sistema de envio de recibos funcionando na porta", port)
}
bootstrap();
