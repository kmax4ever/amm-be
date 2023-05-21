import { Module } from '@nestjs/common';
import { TypegooseModule } from 'nestjs-typegoose';
import { Block } from 'src/models/block.entity';
import { Event } from 'src/models/event.entity';
import { SyncStatus } from 'src/models/syncStatus.entity';
import { DexController } from './dex.controller';
import { DexService } from './dex.service';
import { DexSyncHandler } from './dexSyncHandler.service';
import { DexMatching } from './models/dexMatching.entity';
import { TransferEvent } from './models/transferEvent.entity';
import { DexOrder } from './models/dexOrder.entity';
import { BalanceLog } from './models/balanceLog.entity';
import { User } from './models/user.entity'

@Module({
  imports: [
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
  exports: [TypegooseModule, DexSyncHandler],
  controllers: [DexController],
  providers: [DexService, DexSyncHandler],
})
export class DexModule { }
