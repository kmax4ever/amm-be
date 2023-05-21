import { Injectable, BadRequestException } from '@nestjs/common';
import { DocumentType, ReturnModelType } from '@typegoose/typegoose';
import { Request } from 'express';
import { InjectModel } from 'nestjs-typegoose';
import { DexMatching } from './models/dexMatching.entity';
import { Listing } from './models/dexOrder.entity';
import { TransferEvent } from './models/transferEvent.entity';
import { BalanceLog } from './models/balanceLog.entity';
import { User } from './models/user.entity';
import {set,get} from 'src/utils/memoryCache'
import { pagingFormat,getYesterday } from 'src/utils/helper';


@Injectable()
export class AmmService {
  constructor(
    @InjectModel(DexMatching)
    public readonly DexMatchingModel: ReturnModelType<typeof DexMatching>,

    @InjectModel(Listing)
    public readonly DexOrderModel: ReturnModelType<typeof Listing>,

    @InjectModel(TransferEvent)
    public readonly TransferEventModel: ReturnModelType<typeof TransferEvent>,

    @InjectModel(BalanceLog)
    public readonly BalanceLogModel: ReturnModelType<typeof BalanceLog>,
    @InjectModel(User)
    public readonly userModel: ReturnModelType<
      typeof User>,

  ) {

  }


}
