import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { DexModule } from 'src/modules/dex/dex.module';
import { CoreController } from './core.controler';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { TransformInterceptor } from './interceptors/transform.interceptor';
import { SyncCoreService } from './syncCore.service';
@Module({
  imports: [DexModule],
  controllers: [CoreController],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    SyncCoreService,
  ],
})
export class CoreModule { }
