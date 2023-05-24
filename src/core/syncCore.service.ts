import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { ReturnModelType } from "@typegoose/typegoose";
import config from "config/config";
import { ObjectID } from "mongodb";
import { InjectModel } from "nestjs-typegoose";
import { dbConnection } from "src/app.module";
import { Block } from "src/models/block.entity";
import { Event } from "src/models/event.entity";
import { SyncStatus } from "src/models/syncStatus.entity";
import { DexSyncHandler } from "src/modules/amm/ammSyncHandler.service";
import { Listing } from "src/modules/amm/models/Listing.entity";
import { SyncHandlerService } from "./syncHandler.service";
import { PreSaleList } from "src/modules/amm/models/PresaleList.entity";
import { ADDRESS_SYNC } from "src/modules/amm/config/dexConfig";
const Web3 = require("web3");
export const web3Default = new Web3(config.rpcEndpoint);

export var contractNeedSync = [];

export interface Web3EventType {
  event: string;
  transactionHash: string;
  blockHash: string;
  blockNumber: number;
  returnValues: any;
  transactionIndex: number;
  address: string;
}

export interface Web3LogType {
  data: string;
  topics: string[];
  logIndex: number;
  transactionIndex: 0;
  transactionHash: string;
  blockHash: string;
  blockNumber: number;
  address: string;
}

const waitMs = (msDuration: number) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(null);
    }, msDuration);
  });
};

@Injectable()
export class SyncCoreService {
  //===== SETTINGS ======
  public inititalBlockNum = config.initBlock;
  public version = config.version;
  public modules: SyncHandlerService[] = [];
  public isFirstTimeStartSync = true;

  public lastBlockSynced = 0;
  public incrementBlock = Number(process.env.INCREMENT_BLOCK || 100);
  public folkCheckRange = 0;

  constructor(
    // ==== modules =====

    @Inject(forwardRef(() => DexSyncHandler))
    private readonly dexSyncHandler: DexSyncHandler,
    // =================

    @InjectModel(Block)
    public readonly BlockModel: ReturnModelType<typeof Block>,
    @InjectModel(Event)
    public readonly EventModel: ReturnModelType<typeof Event>,
    @InjectModel(SyncStatus)
    public readonly SyncStatusModel: ReturnModelType<typeof SyncStatus>,
    @InjectModel(Listing)
    public readonly DexOrderModel: ReturnModelType<typeof Listing>,
    @InjectModel(PreSaleList)
    public readonly PreSaleListModel: ReturnModelType<typeof PreSaleList>
  ) {
    this.modules = [dexSyncHandler];

    if (config.isSync === "true") {
      this.start();
    }
  }

  async initSetup() {
    try {
      await this.SyncStatusModel.createCollection();
    } catch (err) {}
    try {
      await this.BlockModel.createCollection();
    } catch (err) {}
    try {
      await this.EventModel.createCollection();
    } catch (err) {}

    for (const module of this.modules) {
      await module.initDb();
    }

    const currentStatus = await this.SyncStatusModel.findOne({});

    if (currentStatus && currentStatus.version !== this.version) {
      await this.BlockModel.deleteMany({});
      await this.EventModel.deleteMany({});
      await this.SyncStatusModel.deleteMany({});

      this.lastBlockSynced = this.inititalBlockNum;

      for (const module of this.modules) {
        await module.onResetVersion();
      }
      return;
    }

    if (currentStatus && currentStatus.lastBlockSynced) {
      this.lastBlockSynced = currentStatus.lastBlockSynced;
    } else {
      this.lastBlockSynced = this.inititalBlockNum;
    }

    contractNeedSync = ADDRESS_SYNC;

    const preSales = await this.PreSaleListModel.find(
      {},
      { presale: 1 }
    ).lean();

    if (preSales.length > 0) {
      const presaleAddress = preSales.map((i) => i.presale);
      contractNeedSync.push(...presaleAddress);
    }
  }

  public async initDb() {
    //@TODO: override this function
    return;
  }

  async start() {
    console.log(`initializing...`);
    await this.initSetup();

    console.log(`Starting sync...`);
    const loopFunc = async () => {
      await this.sync();
      process.nextTick(loopFunc);
    };
    loopFunc();
  }

  async sync() {
    let session;
    try {
      const lastestBlock = (await this.getlastestBlockFromRpc()) ;
      if (lastestBlock <= 0) {
        console.log(`[ERROR] Cannot get newest block`);
        return;
      }

      if (this.lastBlockSynced === lastestBlock) {
        console.log(` ------------[UP TO DATE]---------------`);
        await waitMs(1000);
        return;
      }

      let toBlock = this.lastBlockSynced + this.incrementBlock;
      if (toBlock >= lastestBlock) {
        toBlock = lastestBlock;
      }

      let fromBlock = this.lastBlockSynced + 1;
      if (
        this.lastBlockSynced + this.folkCheckRange > lastestBlock ||
        this.isFirstTimeStartSync
      ) {
        fromBlock = this.lastBlockSynced + 1 - this.folkCheckRange;
      }

      if (fromBlock > toBlock) {
        return;
      }

      session = await dbConnection.startSession();
      await session.startTransaction();
      let isHaveFolk = false;

      console.log(`get events from block ${fromBlock} to block ${toBlock}`);
      console.log({ PRESALE_LIST_SYNC: contractNeedSync });

      const logs = await this.collectLogs(
        fromBlock,
        toBlock,
        contractNeedSync as any
      );

      logs.sort((a: Web3LogType, b: Web3LogType) => {
        if (a.blockNumber === b.blockNumber) {
          return a.logIndex - b.logIndex;
        } else {
          return a.blockNumber - b.blockNumber;
        }
      });

      if (isHaveFolk) {
        console.log(`[DETECT] have folk! let's revert!`);
        await this._revertFolk(fromBlock, this.lastBlockSynced, session);
      } else {
        const newLogs = logs.filter(
          (event) => event.blockNumber > this.lastBlockSynced
        );

        await this._saveBlock(logs, session);

        for (const module of this.modules) {
          await module.processLogs(session, newLogs);
        }
      }

      if (isHaveFolk) {
        await this.SyncStatusModel.findOneAndUpdate(
          {},
          {
            version: this.version,
            lastBlockSynced: fromBlock - 1,
          },
          {
            new: true,
            upsert: true,
            session: session,
          }
        );
        await session.commitTransaction();
        session.endSession();
        this.lastBlockSynced = fromBlock - 1;
      } else {
        await this.SyncStatusModel.findOneAndUpdate(
          {},
          {
            version: this.version,
            lastBlockSynced: toBlock,
          },
          {
            new: true,
            upsert: true,
            session: session,
          }
        );
        await session.commitTransaction();
        session.endSession();
        this.lastBlockSynced = toBlock;
      }
      this.isFirstTimeStartSync = false;
    } catch (err) {
      console.log(`[ERROR] catch fatal error`, err);
      if (session) {
        try {
          await session.abortTransaction();
        } catch (err) {
          console.log(err);
        }
      }
    }
  }

  public async processEvents(session: any, events: Web3EventType[]) {
    return;
    //@TODO: need override this function
  }

  public async onResetData() {
    return;
    //@TODO: need override this function
  }

  private _revertFolk = async (from, to, session: any) => {
    for (let blockNum = to; blockNum >= from; blockNum--) {
      await this.BlockModel.deleteOne({ blockNumber: blockNum }, { session });

      const events = await this.EventModel.find(
        { blockNumber: blockNum },
        {},
        { session }
      ).sort({ createdAt: -1 });
      for (const event of events) {
        await this.EventModel.deleteOne({ _id: event._id }, { session });
        for (const history of event.changeHistory) {
          const collection = await dbConnection.db.collection(
            history.dbModelName
          );
          if (!history.before) {
            await collection.deleteOne(
              {
                _id: new ObjectID(history.after._id),
              },
              { session }
            );
          } else {
            const update = {
              ...history.before,
              _id: undefined,
            };

            await collection.updateOne(
              {
                _id: new ObjectID(history.before._id),
              },
              {
                $set: {
                  ...update,
                },
              },
              { session }
            );
          }
        }
      }
    }
  };

  async collectLogs(
    fromBlock: number,
    toBlock: number,
    filterAddresss?: []
  ): Promise<Web3LogType[]> {
    const logs: Web3LogType[] = await web3Default.eth.getPastLogs({
      address: filterAddresss,
      fromBlock,
      toBlock,
    });

    return logs;
  }

  async getlastestBlockFromRpc() {
    return web3Default.eth.getBlockNumber();
  }

  private async _saveBlock(logs: Web3LogType[], session: any) {
    for (const log of logs) {
      const savedBlocks: any = {};
      const { blockNumber, blockHash } = log;
      if (savedBlocks[blockNumber]) {
        return;
      }
      savedBlocks[blockNumber] = true;

      const block = await this.BlockModel.findOne(
        { blockNumber },
        {},
        { session }
      );
      if (block) {
        return;
      }

      await this.BlockModel.create([{ blockNumber, hash: blockHash }], {
        session,
      });
    }
  }
}
