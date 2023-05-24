import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "./common/pipes/validation.pipe";
import * as compression from "compression";
import { MyLogger } from "./core/logger/logger.service";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import * as cors from "cors";
import * as express from "express";
import { join } from "path";

async function bootstrap() {
  require("source-map-support").install();

  const app = await NestFactory.create(AppModule, {
    logger: new MyLogger(),
    cors: true,
  });
  // app.useLogger(new MyLogger());
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.use(compression());
  app.use("/static", express.static(join("static")));
  //app.enableCors()

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
