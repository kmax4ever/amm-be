import { MiddlewareConsumer, Module } from '@nestjs/common';
import { mongoose } from '@typegoose/typegoose';
import { TypegooseModule } from 'nestjs-typegoose';
import config from '../config/config';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { CoreModule } from './core/core.module';
import { LoggerModule } from './core/logger/logger.module';
import { ScheduleModule } from '@nestjs/schedule'
import { AmmModule } from 'src/modules/amm/amm.module';
export const dbConnection = mongoose.createConnection(config.mongo.uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
});

@Module({
  imports: [
    LoggerModule,
    ScheduleModule.forRoot(),
    TypegooseModule.forRoot(config.mongo.uri, {
      db: dbConnection,
      useNewUrlParser: false,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
    }),
    CoreModule,
    AmmModule
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
