import { Injectable } from "@nestjs/common";
import { ReturnModelType } from "@typegoose/typegoose";
import { InjectModel } from "nestjs-typegoose";
import { Web3EventType, PRESALE_LIST_SYNC } from "src/core/syncCore.service";
import { SyncHandlerService } from "src/core/syncHandler.service";
import { Event } from "src/models/event.entity";
import { DexMatching } from "./models/dexMatching.entity";
import { Listing } from "./models/Listing.entity";
import crypto, { web3Default } from "src/utils/crypto";
import { CONTRACT_SYNC } from "./config/dexConfig";
import { TransferEvent } from "./models/transferEvent.entity";
import { Token } from "./models/token.entity";
import { Lock } from "./models/Lock.entity";
import { ClaimHistory } from "./models/claimHistory.entity";
import { PreSaleList } from "./models/PresaleList.entity";

@Injectable()
export class DexSyncHandler extends SyncHandlerService {
  constructor(
    @InjectModel(Event)
    EventModel: ReturnModelType<typeof Event>,

    //====module models=====
    @InjectModel(DexMatching)
    public readonly DexMatchingModel: ReturnModelType<typeof DexMatching>,
    @InjectModel(Listing)
    public readonly ListingModel: ReturnModelType<typeof Listing>,
    @InjectModel(TransferEvent)
    public readonly TransferEventModel: ReturnModelType<typeof TransferEvent>,
    @InjectModel(Token)
    public readonly TokenModel: ReturnModelType<typeof Token>,
    @InjectModel(Lock)
    public readonly LockModel: ReturnModelType<typeof Lock>,
    @InjectModel(ClaimHistory)
    public readonly ClaimHistoryModel: ReturnModelType<typeof ClaimHistory>,
    @InjectModel(PreSaleList)
    public readonly PreSaleListModel: ReturnModelType<typeof PreSaleList>
  ) {
    super(EventModel);
    this.contracts = CONTRACT_SYNC();
    this.moduleName = "Amm";
  }

  public async initDb() {
    try {
      await this.DexMatchingModel.createCollection();
      await this.ListingModel.createCollection();
      await this.TransferEventModel.createCollection();
    } catch (err) {}
  }

  public async onResetVersion() {
    await this.DexMatchingModel.deleteMany({});
    await this.ListingModel.deleteMany({});
    await this.TransferEventModel.deleteMany({});
  }

  public async processEvents(session: any, events: Web3EventType[]) {
    for (const event of events) {
      switch (event.event) {
        case "ConfigListingToken":
          await this.handleConfigListing(session, event);
          break;
        case "DisableListingToken":
          await this.handleDisableListing(session, event);
          break;
        case "Lock":
          await this.handleLockToken(session, event);
          break;
        case "Claim":
          await this.handleClaim(session, event);
          break;
        case "CreatePresale":
          await this._handleCreatePresale(session, event);
          break;
        default:
          break;
      }
    }
  }

  private async _handleCreatePresale(session, event) {
    console.log(`_handleCreatePresale`);
    const { blockNumber, txhash: transactionHash } = event;

    const {
      token,
      currency,
      owner,
      presale,
      liqClaimStartedAt,
      liqClaimPeriod,
      liqLockDuration,
    } = event.returnValues;

    const [tokenData, currencyData] = await Promise.all([
      this._tokenData(token, session),
      this._tokenData(currency, session),
    ]);

    const block = await web3Default.eth.getBlock(blockNumber);
    PRESALE_LIST_SYNC.push(presale);

    await this.PreSaleListModel.create(
      [
        {
          token: tokenData,
          currency: currencyData,
          txhash: transactionHash,
          owner,
          presale,
          liqClaimStartedAt,
          liqClaimPeriod,
          liqLockDuration,
          timestamp: block.timestamp,
        } as any,
      ],
      { session }
    );
  }

  private async _tokenData(address: string, session) {
    let tokenData = await this.TokenModel.findOne({ token: address }).lean();
    if (!tokenData) {
      const erc20Contract = crypto.erc20Contract(address);

      const [symbol, name, decimals] = await Promise.all([
        erc20Contract.symbol(),
        erc20Contract.name(),
        erc20Contract.decimals(),
      ]);

      tokenData = await this.TokenModel.findOneAndUpdate(
        { token: address },
        { symbol, name, decimals },
        { session, upsert: true, new: true }
      ).lean();
    }

    return { address, ...tokenData };
  }

  private async handleConfigListing(session: any, event: Web3EventType) {
    const { transactionHash: txhash, blockNumber } = event;
    const { sender, token, startedAt, duration } = event.returnValues;

    let tokenData = await this.TokenModel.findOne({
      token: token.toLowerCase(),
    });

    if (!tokenData) {
      const erc20Contract = crypto.erc20Contract(token);

      const [symbol, name, decimals] = await Promise.all([
        erc20Contract.symbol(),
        erc20Contract.name(),
        erc20Contract.decimals(),
      ]);

      tokenData = await this.TokenModel.findOneAndUpdate(
        { token },
        { symbol, name, decimals },
        { session, upsert: true, new: true }
      );
    }

    const { symbol, name, decimals } = tokenData;

    const tax = await crypto.listingFactory().taxPercent(token);

    await this.ListingModel.findOneAndUpdate(
      { token },
      {
        token,
        sender,
        txhash,
        tax: +tax,
        name,
        decimals,
        symbol,
        startedAt,
        duration,
        endedAt: Number(startedAt) + Number(duration),
        nextTimeUpdateTaxAtSec: new Date().getTime() / 1000,
      },
      { session, upsert: true }
    );
  }

  private async handleDisableListing(session: any, event: Web3EventType) {
    const { token } = event.returnValues;
    const { transactionHash } = event;
    await this.ListingModel.findOneAndUpdate(
      { token },
      { transactionHash, isDisable: true },
      { session, upsert: true }
    );
  }

  private async handleLockToken(session: any, event: Web3EventType) {
    const { lockId, owner, sender, lockData } = event.returnValues;
    const { transactionHash: txhash } = event;
    const {
      token,
      startedAt,
      claimStartedAt,
      claimPeriod,
      amount,
      duration,
    } = lockData;

    let tokenData;
    if (!tokenData) {
      const erc20Contract = crypto.erc20Contract(token);

      const [symbol, name, decimals] = await Promise.all([
        erc20Contract.symbol(),
        erc20Contract.name(),
        erc20Contract.decimals(),
      ]);

      tokenData = await this.TokenModel.findOneAndUpdate(
        { token },
        { symbol, name, decimals },
        { session, upsert: true, new: true }
      );
    }

    const { symbol, name, decimals } = tokenData;
    const claimableAmount = await crypto.tokenLocker().claimableAmount(lockId);

    await this.LockModel.create(
      [
        {
          owner,
          sender,
          lockId,
          token,
          symbol,
          name,
          amount,
          startedAt,
          claimPeriod,
          claimStartedAt,
          claimableAmount,
          decimals,
          txhash,
          duration,
        } as any,
      ],
      { session }
    );
  }

  private async handleClaim(session: any, event: Web3EventType) {
    const { amount: claimAmount, owner, updatedLockData } = event.returnValues;
    const {
      token,
      startedAt,
      claimStartedAt,
      claimPeriod,
      duration,
      sender,
    } = updatedLockData;
    const { transactionHash: txhash, blockNumber } = event;

    let tokenData;
    if (!tokenData) {
      const erc20Contract = crypto.erc20Contract(token);

      const [symbol, name, decimals] = await Promise.all([
        erc20Contract.symbol(),
        erc20Contract.name(),
        erc20Contract.decimals(),
      ]);

      tokenData = await this.TokenModel.findOneAndUpdate(
        { token },
        { symbol, name, decimals },
        { session, upsert: true, new: true }
      );
    }
    const blockData = await web3Default.eth.getBlock(blockNumber);

    const { symbol, name, decimals } = tokenData;

    await this.ClaimHistoryModel.create(
      [
        {
          owner,
          sender,
          token,
          symbol,
          name,
          startedAt,
          claimPeriod,
          claimStartedAt,
          claimAmount,
          decimals,
          txhash,
          duration,
          timestamp: blockData.timestamp,
        } as any,
      ],
      { session }
    );
  }
}
