import { Controller, Get, Post, Req } from '@nestjs/common';
import { json, Request } from 'express';
import { MyLogger } from 'src/core/logger/logger.service';
import { DexService } from './dex.service';
import { DexMatching } from './models/dexMatching.entity';
import { InjectModel } from 'nestjs-typegoose';
import { DocumentType, ReturnModelType } from '@typegoose/typegoose';
import { get ,set} from '../../utils/memoryCache'
import { getParam } from '../../utils/getParam'
@Controller('dex')
export class DexController {
  constructor(
    @InjectModel(DexMatching)
    public readonly DexMatchingModel: ReturnModelType<typeof DexMatching>,
    private readonly logger: MyLogger,
    private readonly dexService: DexService,
  ) {
    this.logger.setContext('DexController');
  }


  @Get('trading_volume')
  async tradingVolume(@Req() req: Request) {

    const key_cache = `trading_volume`;
    let rs = get(key_cache);
    if (!rs) {
      console.log('not cache');      
      rs = await this.dexService.tradingVolume(req);
      set(key_cache, rs, 15)
    }
    return rs;
  }

  @Get('coin_supply')
  async coinSupply(@Req() req: Request) {
    return this.dexService.coinSupply(req);
  }

  @Get('market_cap')
  async marketCap(@Req() req: Request) {
    return this.dexService.marketCap(req);
  }

  @Get('eth_getFilterMatchings')
  async getMatchingEvents(@Req() req: Request) {
    return this.dexService.getMatchingEvents(req);
  }

  @Get('eth_getFilterOrders')
  async getOrders(@Req() req: Request) {
    return this.dexService.getOrders(req);
  }

  @Get('eth_getBalance')
  async getInOrderBalance(@Req() req: Request) {
    return this.dexService.getInOrderBalance(req);
  }

  @Get('eth_getPrice')
  async getPrice(@Req() req: Request) {
    return this.dexService.getPrice(req);
  }

  @Get('historyTransfer')
  async getHistoryTransfer(@Req() req: Request) {
    return this.dexService.getHistoryTransfer(req);
  }

  @Post('eth_Address')
  async saveUser(@Req() req: Request) {
    return await this.dexService.saveUser(req);
  }

  @Get('pairInfo24h')
  async pairInfo24h(@Req() req: Request) {
    const param = getParam(req)
    const key_cache = `PAIR_INFO_${JSON.stringify(param)}`;

    let rs = get(key_cache)
    if (!rs) {
      rs = await this.dexService.pairInfo24h(param);
      set(key_cache, rs, 3600)
    }
    return rs;

  }


}
