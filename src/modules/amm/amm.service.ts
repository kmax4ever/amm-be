import { Injectable, BadRequestException, Param } from "@nestjs/common";
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
import { WhiteList } from "./models/WhiteList.entity";
import { Statistic } from "src/modules/amm/models/Statistic.entity";
import { Referrer } from "./models/Referrer.enttiy";
import { Swap } from "./models/Swap.enttiy";
import { Pair } from "./models/Pair.entity";

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
    public readonly PreSaleListModel: ReturnModelType<typeof PreSaleList>,
    @InjectModel(WhiteList)
    public readonly WhiteListModel: ReturnModelType<typeof WhiteList>,
    @InjectModel(Statistic)
    public readonly StatisticModel: ReturnModelType<typeof Statistic>,
    @InjectModel(Referrer)
    public readonly ReferrerModel: ReturnModelType<typeof Referrer>,
    @InjectModel(Swap)
    public readonly SwapModel: ReturnModelType<typeof Swap>,
    @InjectModel(Pair)
    public readonly PairModel: ReturnModelType<typeof Pair>
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

  async tokenByPresale(params) {
    const { presale } = params;
    if (!presale) {
      return null;
    }

    const presaleData = await this.PreSaleListModel.findOne({ presale }).lean();
    return presaleData;
  }

  async whiteList(params) {
    const page = params.page ? parseInt(params.page) : 1;
    const limit =
      parseInt(params.limit) > 10 || !params.limit
        ? 10
        : parseInt(params.limit);
    const skip = parseInt(params.skip);
    const startIndex = isNaN(+params.skip) ? (page - 1) * limit : skip;

    const presale = params.presale ? params.presale.toLowerCase() : "";

    if (!presale) {
      return pagingFormat({ list: [], total: 0, skip, limit });
    }

    const findObj = { presale };

    const [total, docs] = await Promise.all([
      this.WhiteListModel.countDocuments(findObj).lean(),
      this.WhiteListModel.find(findObj)
        .sort({ _id: -1 })
        .limit(limit)
        .skip(startIndex)
        .lean(),
    ]);

    const presaleData = await this.PreSaleListModel.findOne({ presale }).lean();

    for (const i of docs) {
      i[`presaleData`] = presaleData;
    }

    return pagingFormat({ list: docs, total, skip, limit });
  }

  async presaleActive(params) {
    const page = params.page ? parseInt(params.page) : 1;
    const limit =
      parseInt(params.limit) > 10 || !params.limit
        ? 10
        : parseInt(params.limit);
    const skip = parseInt(params.skip);
    const startIndex = isNaN(+params.skip) ? (page - 1) * limit : skip;

    const invester = params.invester ? params.invester.toLowerCase() : "";

    if (!invester) {
      return pagingFormat({ list: [], total: 0, skip, limit });
    }

    const presaleList = await this.WhiteListModel.find({ invester }).lean();

    const presales = presaleList.map((i) => i.presale);

    const findObj = { presale: { $in: presales } };

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

  async presaleData(params) {
    const presale = params.presale ? params.presale.toLowerCase() : "";
    const invester = params.invester ? params.invester.toLowerCase() : "";
    if (!presale) {
      return;
    }

    const [presaleItem, whiteListData] = await Promise.all([
      this.PreSaleListModel.findOne({ presale }).lean(),
      this.WhiteListModel.findOne({ presale, invester }).lean(),
    ]);

    if (!presaleItem) {
      return null;
    }

    if (invester) {
      presaleItem[`inWhiteList`] = whiteListData ? true : false;
    }

    return presaleItem;
  }

  async dashboard() {
    const statistic = await this.StatisticModel.findOne({}).lean();
    return statistic;
  }

  async refStatistic(params) {
    const { referrer } = params;

    const now = new Date().getTime() / 1000;

    const time24hAgo = now - 24 * 60 * 60;
    const time7day = now - 7 * 24 * 60 * 60;

    const volume = async (childs = [], time = 0) => {
      const datas = await this.SwapModel.aggregate([
        {
          $match: {
            to: { $in: childs },
            timestamp: { $gte: time },
          },
        },
        {
          $group: {
            _id: null,
            volume: { $sum: "$volumeUSD" },
            count: { $sum: 1 },
          },
        },
      ]);

      const rs = {
        count: datas[0]?.count ? datas[0].count : 0,
        volumeUSD: datas[0]?.volume ? datas[0].volume : 0,
      };
      return rs;
    };

    const referrers = await this.ReferrerModel.find({
      referrer: referrer.toLowerCase(),
    }).lean();

    const refCount = referrers.length;

    const childs = referrers.map((i) => i.child) as any;

    const [volume24hData, volume7dData] = await Promise.all([
      volume(childs, time24hAgo),
      volume(childs, time7day),
    ]);

    return { refCount, volume24hData, volume7dData };
  }

  async volumeChilds(params) {
    const { referrer } = params;

    const now = new Date().getTime() / 1000;

    const time30day = now - 30 * 24 * 60 * 60;

    const referrers = await this.ReferrerModel.find({
      referrer: referrer.toLowerCase(),
    }).lean();

    const childs = referrers.map((i) => i.child) as any;
    const volumeChilds = await this.SwapModel.aggregate([
      {
        $match: {
          to: { $in: childs },
          timestamp: { $gte: time30day },
        },
      },

      {
        $project: {
          volumeUSD: 1,
          timeSec: { $toDate: { $multiply: ["$timestamp", 1000] } },
        },
      },
      {
        $project: {
          volumeUSD: 1,
          date: { $toDate: "$timeSec" },
          timeSec: 1,
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          txCount: { $sum: 1 },
          volumeUSD: { $sum: "$volumeUSD" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    return volumeChilds;
  }

  async pairs(params) {
    const page = params.page ? parseInt(params.page) : 1;
    const limit =
      parseInt(params.limit) > 10 || !params.limit
        ? 10
        : parseInt(params.limit);
    const skip = parseInt(params.skip);
    const startIndex = isNaN(+params.skip) ? (page - 1) * limit : skip;

    const [total, docs] = await Promise.all([
      this.PairModel.countDocuments({}).lean(),
      this.PairModel.find({})
        .sort({ _id: -1 })
        .limit(limit)
        .skip(startIndex)
        .lean(),
    ]);

    return pagingFormat({ list: docs, total, skip, limit });
  }

  async presaleByToken(params) {
    const { token } = params;

    const presale = await this.PreSaleListModel.findOne({
      "token.address": token.toLowerCase(),
    });
    if (!presale) {
      return { presale: null };
    }

    return { presale };
  }
}
