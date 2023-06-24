import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import "reflect-metadata"
import * as cookieParser from "cookie-parser"
import * as bodyParser from "body-parser"

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser())
  app.use(bodyParser.json({ limit: "150mb" }))
  app.use(bodyParser.urlencoded({ limit: "150mb", extended: true }))
  await app.listen(3001, () => {
    console.log("connected to 3001 port");
  });
}
bootstrap();
