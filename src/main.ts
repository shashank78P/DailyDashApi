import { ValidationPipe } from "@nestjs/common"
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import "reflect-metadata"
import * as cookieParser from "cookie-parser"
import * as bodyParser from "body-parser"
import * as dotenv from 'dotenv';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ skipMissingProperties: false }))

  dotenv.config();

  app.use(cookieParser())
  app.use(bodyParser.json({ limit: "150mb" }))
  app.use(bodyParser.urlencoded({ limit: "150mb", extended: true }))
  await app.listen(3001, () => {
    console.log("connected to 3001 port");
  });
}
bootstrap();