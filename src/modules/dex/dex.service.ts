import { Injectable, BadRequestException } from '@nestjs/common';
import { DocumentType, ReturnModelType } from '@typegoose/typegoose';
import { Request } from 'express';
import { InjectModel } from 'nestjs-typegoose';
import { getBook, getBookByCoin,TOKEN_ADDRESSES } from './config/dexConfig';
import { DexMatching } from './models/dexMatching.entity';
import { DexOrder } from './models/dexOrder.entity';
import { DEX_CONTRACT_ADDRESS } from './config/dexConfig';
import { TransferEvent } from './models/transferEvent.entity';
import { BalanceLog } from './models/balanceLog.entity';
import { User } from './models/user.entity';
import {set,get} from 'src/utils/memoryCache'
import { pagingFormat,getYesterday } from 'src/utils/helper';


@Injectable()
export class DexService {
  constructor(
    @InjectModel(DexMatching)
    public readonly DexMatchingModel: ReturnModelType<typeof DexMatching>,

    @InjectModel(DexOrder)
    public readonly DexOrderModel: ReturnModelType<typeof DexOrder>,

    @InjectModel(TransferEvent)
    public readonly TransferEventModel: ReturnModelType<typeof TransferEvent>,

    @InjectModel(BalanceLog)
    public readonly BalanceLogModel: ReturnModelType<typeof BalanceLog>,
    @InjectModel(User)
    public readonly userModel: ReturnModelType<
      typeof User>,

  ) {

    this.loadPrice() // load tee,dkk price;
    this.loadDrkPrice();
  }


  private async loadDrkPrice() {

    setInterval(async () => {
       //TODO
     //get price
     //save to cache

    }, 10000)
  }

  private async loadPrice() { //because function need param is dexMachingModel
    setInterval(async () => {
     //TODO
     //get price
     //save to cache


    }, 5000)
  }

  public async getHistoryTransfer(req: Request) {
    const param = req.query;
    const limit = param.limit ? Number(param.limit) : 10;
    const skip = param.skip ? Number(param.skip) : 0;
    const { owner, contractAddress } = param;

    if (!owner) {
      throw 'Invalid owner';
    }

    if (!contractAddress) {
      throw 'Invalid contract address';
    }

    let isToken = false;
    if (
      TOKEN_ADDRESSES.map(item => item.toLowerCase()).includes(
        (contractAddress as string).toLowerCase(),
      )
    ) {
      isToken = true;
    }

    let query: any;

    if (isToken) {
      query = {
        $or: [
          {
            from: (owner as string).toLowerCase(),
            contractAddress: {
              $in: [
                contractAddress
              ],
            },
            to: {
              $nin: [
                DEX_CONTRACT_ADDRESS,
              ],
            },
          },
          {
            to: (owner as string).toLowerCase(),
            contractAddress: {
              $in: [
                contractAddress
              ],
            },
            from: {
              $nin: [
                DEX_CONTRACT_ADDRESS,
              ],
            },
          },
        ],
      };
    } else {
      query = {
        $or: [
          {
            from: (owner as string).toLowerCase(),
            contractAddress: {
              $in: [
                contractAddress
              ],
            },
            to: '0x0000000000000000000000000000000000000000',
          },
          {
            to: (owner as string).toLowerCase(),
            contractAddress: {
              $in: [
                contractAddress
              ],
            },
            from: '0x0000000000000000000000000000000000000000',
          },
        ],
      };
    }


    const promises: any = [
      this.TransferEventModel.count(query),
      this.TransferEventModel.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
    ];

    const data = await Promise.all(promises);

    const total = data[0];
    const list = data[1];

    const rs = pagingFormat({ total, list, skip, limit });
    return rs;
  }

  public async getPrice(req: Request) {
    const param = req.query;
    const { sellBookId, buyBookId } = param;

    if (!sellBookId) {
      throw 'SellBookId requied';
    }

    if (!buyBookId) {
      throw 'buyBookId requied';
    }

    const query = {
      sellBook: sellBookId,
      buyBook: buyBookId,
      createdAt: { $gte: getYesterday() },
    };

    const newLestMatching = await this.DexMatchingModel.find(query as any)
      .sort({ createdAt: -1 })
      .limit(1);

    const lastDateMatching = await this.DexMatchingModel.find(query as any)
      .sort({ createdAt: 1 })
      .limit(1);

    const lastPrice24h = lastDateMatching[0]
      ? Number(lastDateMatching[0].price)
      : 0;
    const newLestPrice = newLestMatching[0]
      ? Number(newLestMatching[0].price)
      : 0;
    const value = newLestPrice - lastPrice24h;

    const percent = value != 0 ? (value / lastPrice24h) * 100 : 0;
    const rs = {
      lastPrice24h,
      newLestPrice,
      lastDateChange: {
        value,
        percent,
      },
    };

    return rs;
  }

  public async getInOrderBalance(req: Request) {
    const param = req.query;
    const { owner } = param;
    if (!owner) {
      throw 'Invalid owner';
    }

    const match = {
      $match: {
        owner,
        inOrder: true,
      },
    };

    const coinBooks = getBookByCoin();
    // console.log(coinBooks);

    const rs = [];
    for (const key in coinBooks) {
      const { listBook } = coinBooks[`${key}`];
      match.$match[`bookId`] = { $in: listBook };
      const inOrder = await this._getOrderAmount(match);
      coinBooks[`${key}`][`inOrder`] = inOrder;

      rs.push({
        inOrder,
        token: coinBooks[`${key}`].tokenA
          ? coinBooks[`${key}`].tokenA
          : coinBooks[`${key}`].tokenB,
      });
    }

    return rs;
  }

  private async _getOrderAmount(math) {
    const data = await this.DexOrderModel.aggregate([
      math,
      {
        $group: {
          _id: 1,
          inOrder: { $sum: '$amount' },
        },
      },
    ]);
    return data[0] ? data[0].inOrder : 0;
  }

  public async getOrders(req: Request) {
    const param = req.query;
    const limit = param.limit ? Number(param.limit) : 10;
    const skip = param.skip ? Number(param.skip) : 0;
    const { owner, sellBookId, buyBookId, status } = param;

    if (!owner) {
      throw 'owner requied';
    }

    if (!sellBookId) {
      throw 'SellBookId requied';
    }

    if (!buyBookId) {
      throw 'buyBookId requied';
    }
    const query = {
      owner,
      bookId: {
        $in: [
          sellBookId,        
          buyBookId        
        ],
      },
    };
    const statusArr = ['ACTIVE', 'FILLED', 'CANCELLED'];
    if (status) {
      if (!statusArr.some(i => i === status)) {
        throw ' status must be in ACTIVE or FILLED or CANCELLED ';
      }
      query['status'] = status;
    }

    const promises = [
      this.DexOrderModel.count(query as any),
      this.DexOrderModel.find(query as any)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
    ];

    const results = await Promise.all(promises as any);
    const total = results[0];
    const list = results[1];

    const rs = pagingFormat({ list, total, skip, limit });
    return rs;
  }

  public async getMatchingEvents(req: Request) {
    const param = req.query;
    const { sellBookId, buyBookId } = param;
    const key = sellBookId.toString() + buyBookId.toString();
    const rs = get(key);
    if (rs) {
      //console.log('==============xxx get from memory cache===========');
      return rs;
    } else {
      //console.log('---------------xxx get from query------------------');
      if (!sellBookId) {
        throw 'SellBookId requied';
      }

      if (!buyBookId) {
        throw 'buyBookId requied';
      }

      const yesterday = getYesterday();
      console.log({ yesterday });

      const query = {
        sellBook: {
          $in: [sellBookId],
        },
        buyBook: {
          $in: [buyBookId],
        },
        createdAt: { $gte: yesterday },
      };

      let rs = await this.DexMatchingModel.find(query as any).limit(1000).sort({
        createdAt: -1,
      });

      if (rs.length === 0) {
        const data = JSON.parse(
          JSON.stringify(
            await this.DexMatchingModel.find({
              sellBook: {
                $in: [
                  sellBookId                  
                ],
              },
              buyBook: {
                $in: [buyBookId],
              },
            } as any)
              .sort({ createdAt: -1 })
              .limit(1),
          ),
        );

        const { createdAt } = data[0] ? data[0] : new Date();
        const date = new Date(createdAt);
        const new_yesterday = new Date(date);
        new_yesterday.setDate(new_yesterday.getDate() - 1);

        query.createdAt = { $gte: new_yesterday };

        rs = await this.DexMatchingModel.find(query as any).sort({
          createdAt: -1,
        });
      }

      set(key, rs, 3);
      return rs;
    }
  }

  public async marketCap(req?: any) {
    const rs = {
      market_cap: 0,
    };

    // TOTO calculate maketcap

    return rs;
  }

  public async coinSupply(req?: any) {
    const rs = {
      coin_supply: 0,
    };
 // TOTO calculate coin supply

    return rs;
  }

  async tradingVolume(req: Request) {
    const rs = {
      trading_volume: 0,
    };
     // TOTO calculate trading volume
    return rs;
  }


  private async _getVolumeByBook(sellBookId: string, buyBookId: string) {
    if (!sellBookId || !buyBookId) {
      return 0;
    }
    const query = [
      {
        $match: {
          sellBook: sellBookId,
          buyBook: buyBookId,
          createdAt: { $gte: getYesterday() },
        },
      },

      {
        $project: {
          _id: null,
          volume: {
            $multiply: [{ $toDouble: '$price' }, { $toDouble: '$amount' }],
          },
        },
      },
      {
        $group: {
          _id: 1,
          sum_volume: { $sum: '$volume' },
        },
      },
    ];

    const rs = await this.DexMatchingModel.aggregate(query);
    return rs[0] && rs[0].sum_volume ? rs[0].sum_volume : 0;
  }

  public async saveUser(req: Request) {
    const { dexAddress, metamaskAddress } = req.body;
    if (!dexAddress) {
      throw 'Dex Address requied'
    }

    if (!metamaskAddress) {
      throw 'Dex Address requied'
    }

    const user = await this.userModel.findOne({
      $or: [
        { 'dexAddress': { $in: [dexAddress, metamaskAddress] } },
        { 'metamaskAddress': { $in: [dexAddress, metamaskAddress] } }
      ]
    });

    if (user) {
      return false;
    }

    await this.userModel.create({ dexAddress, metamaskAddress });
    return true;
  }

  private async _getPriceCoin(sellBookId, buyBookId) {
    const lastMatching = await this.DexMatchingModel
      .find({ sellBook: sellBookId, buyBook: buyBookId })
      .sort({ createdAt: -1 })
      .limit(1);
    return (lastMatching[0] && lastMatching[0].price) ? lastMatching[0].price : 0
  }

  public async pairInfo24h(param) {

    const { sellBookId, buyBookId } = param;

    if (!sellBookId) {
      throw 'SellBookId requied'
    }

    if (!buyBookId) {
      throw 'buyBookId requied'
    }

    const query = {
      sellBook: sellBookId,
      buyBook: buyBookId,
      createdAt: { $gte: getYesterday() }
    }


    const promises = [
      this.DexMatchingModel.aggregate(
        [
          {
            $match: query
          },
          {
            $addFields: {
              "intPrice": { $toDouble: "$price" }
            }
          },
          {
            $sort: {
              "intPrice": -1,
            }
          }
          , { $limit: 1 }

        ]
      )
      ,
      this.DexMatchingModel
        .aggregate(
          [
            {
              $match: query
            },
            {
              $addFields: {
                "intPrice": { $toDouble: "$price" }
              }
            },
            {
              $sort: {
                "intPrice": 1,
              }
            }
            , { $limit: 1 }

          ]
        ),
      this._getVolumeByBook(sellBookId, buyBookId),
      this.DexMatchingModel
        .find(query)
        .sort({ createdAt: 1 })
        .limit(1),
    ];

    const results = await Promise.all(promises);

    const highestMatch = results[0];
    let highestPrice = highestMatch[0] ? (highestMatch[0].price) : 0;

    const lowestMatch = results[1];
    let lowestPrice = lowestMatch[0] ? (lowestMatch[0].price) : 0;


    const volume = results[2];
    const oldestMatch = results[3];

    let oldestPrice = oldestMatch[0] ? oldestMatch[0].price : 0
    if (!oldestPrice) {
      const lastOldestMatch = await this.DexMatchingModel
        .find({
          sellBook: sellBookId,
          buyBook: buyBookId
        })
        .sort({ createdAt: -1 })
        .limit(1);

      oldestPrice = lastOldestMatch[0] ? lastOldestMatch[0].price : 0
    }

    if (!highestPrice && !lowestPrice) {
      highestPrice = oldestPrice;
      lowestPrice = oldestPrice;
    }

    const rs = {
      oldestPrice,
      lowestPrice,
      highestPrice,
      volume
    }

    return rs;
  }

}
