import { Module, CacheModule} from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { AmmModule } from "src/modules/amm/amm.module";
import { CoreController } from "./core.controler";
import { LoggingInterceptor } from "./interceptors/logging.interceptor";
import { TransformInterceptor } from "./interceptors/transform.interceptor";
import { SyncCoreService } from "./syncCore.service";
import { DexSyncHandler } from "src/modules/amm/ammSyncHandler.service";
import { TypegooseModule } from 'nestjs-typegoose';
import { Event } from 'src/models/event.entity';
import {Block} from 'src/models/block.entity'
import {SyncStatus} from 'src/models/syncStatus.entity'
import {DexMatching} from 'src/modules/amm/models/dexMatching.entity'
import {DexOrder} from 'src/modules/amm/models/dexOrder.entity'
import {TransferEvent} from 'src/modules/amm/models/transferEvent.entity'
import {BalanceLog} from 'src/modules/amm/models/balanceLog.entity'
import {User} from 'src/modules/amm/models/user.entity'
@Module({
  imports: [
    CacheModule.register({
      ttl: 5, // seconds
      // store: redisStore,
      // url: process.env.REDIS_URL,
      ignoreCacheErrors: true,
      enable_offline_queue: false,
      connect_timeout: 5000,
      //  db: 1,
    }),
    TypegooseModule.forFeature([
      Event,
      Block,
      SyncStatus,
      DexMatching,
      DexOrder,
      TransferEvent,
      BalanceLog,
      User
    ]),
  ],
  controllers: [CoreController],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    SyncCoreService,
    DexSyncHandler
  ],
  exports:[CacheModule]
})
export class CoreModule {}
