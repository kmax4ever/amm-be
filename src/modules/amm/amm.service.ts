import { Injectable, BadRequestException } from "@nestjs/common";
import { DocumentType, ReturnModelType } from "@typegoose/typegoose";
import { Request } from "express";
import { InjectModel } from "nestjs-typegoose";
import { DexMatching } from "./models/dexMatching.entity";
import { Listing } from "./models/Listing.entity";
import { TransferEvent } from "./models/transferEvent.entity";
import { BalanceLog } from "./models/balanceLog.entity";
import { pagingFormat, getYesterday } from "src/utils/helper";
import { ClaimHistory } from "./models/claimHistory.entity";
import { Lock } from "./models/Lock.entity";
import { PreSaleList } from "./models/PresaleList.entity";

@Injectable()
export class AmmService {
  constructor(
    @InjectModel(Listing)
    public readonly ListtingModel: ReturnModelType<typeof Listing>,
    @InjectModel(Lock)
    public readonly LockModel: ReturnModelType<typeof Lock>,

    @InjectModel(ClaimHistory)
    public readonly ClaimHistoryModel: ReturnModelType<typeof ClaimHistory>,
    @InjectModel(PreSaleList)
    public readonly PreSaleListModel: ReturnModelType<typeof PreSaleList>
  ) {}

  async listings(params) {
    const page = params.page ? parseInt(params.page) : 1;
    const limit =
      parseInt(params.limit) > 10 || !params.limit
        ? 10
        : parseInt(params.limit);
    const skip = parseInt(params.skip);
    const startIndex = isNaN(+params.skip) ? (page - 1) * limit : skip;

    const sender = params.sender ? params.sender : "";

    const [total, docs] = await Promise.all([
      this.ListtingModel.countDocuments({
        sender: sender.toLowerCase(),
      }).lean(),
      this.ListtingModel.find({ sender: sender.toLowerCase() })
        .sort({ _id: -1 })
        .limit(limit)
        .skip(startIndex)
        .lean(),
    ]);

    return pagingFormat({ list: docs, total, skip, limit });
  }

  async getToken(params) {
    const { token } = params;

    if (!token) {
      return null;
    }

    const now = new Date().getTime() / 1000;
    const tokenListing = await this.ListtingModel.findOne({
      token: token.toLowerCase(),
      endedAt: { $gte: now },
    }).lean();

    if (!tokenListing) {
      return null;
    }

    return tokenListing;
  }

  async claimHistory(params) {
    const page = params.page ? parseInt(params.page) : 1;
    const limit =
      parseInt(params.limit) > 10 || !params.limit
        ? 10
        : parseInt(params.limit);
    const skip = parseInt(params.skip);
    const startIndex = isNaN(+params.skip) ? (page - 1) * limit : skip;

    const owner = params.owner ? params.owner : "";

    const [total, docs] = await Promise.all([
      this.ClaimHistoryModel.countDocuments({
        owner: owner.toLowerCase(),
      }).lean(),
      this.ClaimHistoryModel.find({ owner: owner.toLowerCase() })
        .sort({ _id: -1 })
        .limit(limit)
        .skip(startIndex)
        .lean(),
    ]);

    return pagingFormat({ list: docs, total, skip, limit });
  }

  async locks(params) {
    const page = params.page ? parseInt(params.page) : 1;
    const limit =
      parseInt(params.limit) > 10 || !params.limit
        ? 10
        : parseInt(params.limit);
    const skip = parseInt(params.skip);
    const startIndex = isNaN(+params.skip) ? (page - 1) * limit : skip;

    const owner = params.owner ? params.owner : "";

    const [total, docs] = await Promise.all([
      this.LockModel.countDocuments({
        owner: owner.toLowerCase(),
      }).lean(),
      this.LockModel.find({ owner: owner.toLowerCase() })
        .sort({ _id: -1 })
        .limit(limit)
        .skip(startIndex)
        .lean(),
    ]);

    return pagingFormat({ list: docs, total, skip, limit });
  }

  async presaleList(params) {
    const page = params.page ? parseInt(params.page) : 1;
    const limit =
      parseInt(params.limit) > 10 || !params.limit
        ? 10
        : parseInt(params.limit);
    const skip = parseInt(params.skip);
    const startIndex = isNaN(+params.skip) ? (page - 1) * limit : skip;

    const owner = params.owner ? params.owner.toLowerCase() : "";
    const presale = params.presale ? params.presale.toLowerCase() : "";

    if (!owner && !presale) {
      return pagingFormat({ list: [], total: 0, skip, limit });
    }

    const findObj = owner ? { owner } : { presale };

    const [total, docs] = await Promise.all([
      this.PreSaleListModel.countDocuments(findObj).lean(),
      this.PreSaleListModel.find(findObj)
        .sort({ _id: -1 })
        .limit(limit)
        .skip(startIndex)
        .lean(),
    ]);

    return pagingFormat({ list: docs, total, skip, limit });
  }
}
