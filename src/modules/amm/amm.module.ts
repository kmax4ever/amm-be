import { Module } from '@nestjs/common';
import { TypegooseModule } from 'nestjs-typegoose';
import { Block } from 'src/models/block.entity';
import { Event } from 'src/models/event.entity';
import { SyncStatus } from 'src/models/syncStatus.entity';
import { AmmController } from './amm.controller';
import { AmmService } from './amm.service';
import { DexSyncHandler } from './ammSyncHandler.service';
import { DexMatching } from './models/dexMatching.entity';
import { TransferEvent } from './models/transferEvent.entity';
import { Listing } from './models/dexOrder.entity';
import { BalanceLog } from './models/balanceLog.entity';
import { User } from './models/user.entity'
import { CoreModule } from 'src/core/core.module';

@Module({
  imports: [
    CoreModule
  ],
  exports: [TypegooseModule],
  controllers: [AmmController],
  providers: [AmmService],
})
export class AmmModule { }
