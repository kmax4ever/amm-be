import { Controller, Get, Post, Req ,CacheInterceptor,CacheTTL,UseInterceptors} from '@nestjs/common';
import { json, Request } from 'express';
import { MyLogger } from 'src/core/logger/logger.service';
import { AmmService } from './amm.service';
import { DexMatching } from './models/dexMatching.entity';
import { InjectModel } from 'nestjs-typegoose';
import { DocumentType, ReturnModelType } from '@typegoose/typegoose';
import { get ,set} from '../../utils/memoryCache'
import { getParam } from '../../utils/getParam'
@Controller('amm')
export class AmmController {
  constructor(
    @InjectModel(DexMatching)
    public readonly DexMatchingModel: ReturnModelType<typeof DexMatching>,
    private readonly logger: MyLogger,
    private readonly dexService: AmmService,
  ) {
    this.logger.setContext('DexController');
  }



  @Get('getFightLogs')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(120) //2 minutes
  async getFightLogs(@Req() req) {
  }



}
