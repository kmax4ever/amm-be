import { Controller, Get, HttpException, Req } from '@nestjs/common';
import { ReturnModelType } from '@typegoose/typegoose';
import { Request } from 'express';
import { InjectModel } from 'nestjs-typegoose';
import { MyLogger } from 'src/core/logger/logger.service';
import { SyncStatus } from 'src/models/syncStatus.entity';
import { getLastestBlock } from 'src/utils/callApi';

@Controller('core')
export class CoreController {
  constructor(
    private readonly logger: MyLogger,

    @InjectModel(SyncStatus)
    public readonly SyncStatusModel: ReturnModelType<typeof SyncStatus>,
  ) {
    this.logger.setContext('CoreController');
  }

  @Get('status')
  async status(@Req() req: Request) {
    try {
      const latestBlockFromFullNode = await getLastestBlock();
      const data = await this.SyncStatusModel.findOne({});

      const lastBlock = data ? data.lastBlockSynced : 0;
      const isUpToDate = lastBlock + 50 > latestBlockFromFullNode;

      if (isUpToDate) {
        return {
          lastBlock,
          latestBlockFromFullNode,
          lateRange: latestBlockFromFullNode - lastBlock,
        };
      } else {
        throw new HttpException(
          {
            message: 'Sync is not working now!',
            lastBlock,
            latestBlockFromFullNode,
            lateRange: latestBlockFromFullNode - lastBlock,
          },
          400,
        );
      }
    } catch (err) {
      throw new HttpException(
        {
          message: 'Sync is not working now!',
          error: err,
        },
        400,
      );
    }
  }
}
