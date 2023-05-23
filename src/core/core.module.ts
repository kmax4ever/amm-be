import { Module, CacheModule } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { CoreController } from "./core.controler";
import { LoggingInterceptor } from "./interceptors/logging.interceptor";
import { TransformInterceptor } from "./interceptors/transform.interceptor";
import { SyncCoreService } from "./syncCore.service";
import { DexSyncHandler } from "src/modules/amm/ammSyncHandler.service";
import { TypegooseModule } from "nestjs-typegoose";
import { Event } from "src/models/event.entity";
import { Block } from "src/models/block.entity";
import { SyncStatus } from "src/models/syncStatus.entity";
import { DexMatching } from "src/modules/amm/models/dexMatching.entity";
import { Listing } from "src/modules/amm/models/Listing.entity";
import { TransferEvent } from "src/modules/amm/models/transferEvent.entity";
import { BalanceLog } from "src/modules/amm/models/balanceLog.entity";
import { Token } from "src/modules/amm/models/token.entity";
import { Lock } from "src/modules/amm/models/Lock.entity";
import { ClaimHistory } from "src/modules/amm/models/claimHistory.entity";
import { UtilService } from "./utils.service";
import { PreSaleList } from "src/modules/amm/models/PresaleList.entity";
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
      Listing,
      TransferEvent,
      BalanceLog,
      Token,
      Lock,
      ClaimHistory,
      PreSaleList
    ]),
  ],
  controllers: [CoreController],
  providers: [SyncCoreService, DexSyncHandler, UtilService],
  exports: [CacheModule, TypegooseModule],
})
export class CoreModule {}
