import { Injectable, BadRequestException } from "@nestjs/common";
import { DocumentType, ReturnModelType } from "@typegoose/typegoose";
import { Request } from "express";
import { InjectModel } from "nestjs-typegoose";
import { DexMatching } from "./models/dexMatching.entity";
import { TransferEvent } from "./models/transferEvent.entity";
import { BalanceLog } from "./models/balanceLog.entity";
import { User } from "./models/user.entity";
import { pagingFormat, getYesterday, waitMs } from "src/utils/helper";
import crypto from "../../utils/crypto";
import { Listing } from "./models/Listing.entity";
import { UtilService } from "src/core/utils.service";

@Injectable()
export class AmmCronService {
  constructor(
    @InjectModel(DexMatching)
    public readonly DexMatchingModel: ReturnModelType<typeof DexMatching>,

    @InjectModel(Listing)
    public readonly DexOrderModel: ReturnModelType<typeof Listing>,

    @InjectModel(TransferEvent)
    public readonly TransferEventModel: ReturnModelType<typeof TransferEvent>,

    @InjectModel(BalanceLog)
    public readonly BalanceLogModel: ReturnModelType<typeof BalanceLog>,
    @InjectModel(Listing)
    public readonly ListingModel: ReturnModelType<typeof Listing>,
    private readonly utilService: UtilService
  ) {
    this.start();
  }

  async start() {
    const loopFuncTaxListing = async () => {
      console.log(`Loop update tax.....`);
      await waitMs(3000);
      await this.processUpdateTax();
      process.nextTick(loopFuncTaxListing);
    };
    loopFuncTaxListing();
  }

  async processUpdateTax() {
    const listingContract = crypto.listingFactory();
    const now = new Date().getTime() / 1000;
    const objFind = {
      endedAt: { $gte: now },
      startedAt: { $lte: now },
      nextTimeUpdateTaxAtSec: { $ne: 0 },
    };
    const lists = await this.ListingModel.find(objFind)
      .limit(50)
      .lean();

    const mapTaxPercent = {};

    const getTaxPercent = async (token: string) => {
      const tax = await listingContract.taxPercent(token);
      mapTaxPercent[token] = tax;
    };

    const tasks = [];

    for (const item of lists) {
      const { token } = item;

      tasks.push(getTaxPercent(token));
    }
    await Promise.all(tasks);

    const tasksUpdateDb = [];
    for (const item of lists) {
      const { token } = item;
      const nextTimeUpdateTaxAtSec = now + 5;
      const tax = mapTaxPercent[token];

      tasksUpdateDb.push({
        updateOne: {
          filter: { token },
          update: {
            tax,
            nextTimeUpdateTaxAtSec,
          },
        },
      });
    }

    await this.utilService.util_createSession({
      execFunc: async (session) => {
        await this.ListingModel.bulkWrite(tasksUpdateDb, { session });
      },
    });
  }
}
