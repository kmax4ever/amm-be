import { Injectable } from "@nestjs/common";
import { ReturnModelType } from "@typegoose/typegoose";
import { InjectModel } from "nestjs-typegoose";
import { Web3EventType, contractNeedSync } from "src/core/syncCore.service";
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
import { WhiteList } from "./models/WhiteList.entity";
import { Referrer } from "./models/Referrer.enttiy";
import { Swap } from "./models/Swap.enttiy";
import { getPriceUsdBySymbol } from "src/utils/getPrices";
import { Pair } from "./models/Pair.entity";

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
    public readonly PreSaleListModel: ReturnModelType<typeof PreSaleList>,
    @InjectModel(WhiteList)
    public readonly WhiteListModel: ReturnModelType<typeof WhiteList>,
    @InjectModel(Referrer)
    public readonly ReferrerModel: ReturnModelType<typeof Referrer>,
    @InjectModel(Swap)
    public readonly SwapModel: ReturnModelType<typeof Swap>,
    @InjectModel(Pair)
    public readonly PairModel: ReturnModelType<typeof Pair>
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

        case "ConfigLiqLock":
          await this._handleConfigLiqLock(session, event);
          break;
        case "ConfigBuyLock":
          await this._handleConfigBuyLock(session, event);
          break;
        case "SetTokenPrice":
          await this._handleSetTokenPrice(session, event);
          break;

        case "SetMinTokenBuyA":
          await this._handleSetMinTokenBuyA(session, event);
          break;
        case "SetMaxBuyOf": // white list
          await this._handleSetMaxBuyOf(session, event);
          break;
        case "Buy":
          await this._handleBuy(session, event);
          break;

        case "UpdateReferrer":
          await this._handleUpdateReferrer(session, event);
          break;

        case "Swap":
          await this._handleSwap(session, event);
          break;
        case "PairCreated":
          await this._handlePairCreated(session, event);
          break;

        default:
          break;
      }
    }
  }

  private async _handlePairCreated(session, event) {
    console.log("xxx _handlePairCreated");

    const { blockNumber, transactionHash } = event;
    const blockData = await web3Default.eth.getBlock(blockNumber);
    const timestamp = blockData.timestamp;
    const { token0, token1, pair } = event.returnValues;

    const [token0Data, token1Data] = await Promise.all([
      this._tokenData(token0, session),
      this._tokenData(token1, session),
    ]);

    const pairData = {
      token0,
      token1,
      pair,
      timestamp,
      transactionHash,
      token0Data,
      token1Data,
    };
    await this.PairModel.create([pairData], { session });
  }
  private async _handleSwap(session, event) {
    // PZT
    console.log({ event });
    const { blockNumber, transactionHash } = event;
    const blockData = await web3Default.eth.getBlock(blockNumber);
    const timestamp = blockData.timestamp;
    // sender ===child

    const {
      sender,
      to,
      amount0In,
      amount1In,
      amount0Out,
      amount1Out,
    } = event.returnValues;

    const ethUSD = await getPriceUsdBySymbol("ETH");

    const ethAmount =
      amount0In != "0"
        ? +crypto.fromWei(amount0In)
        : +crypto.fromWei(amount0Out);
    const volumeUSD = ethAmount * ethUSD;
    //
    console.log({ volume: volumeUSD });

    await this.SwapModel.create(
      [
        {
          sender,
          to,
          amount0In,
          amount1In,
          amount0Out,
          amount1Out,
          ethUSD,
          volumeUSD,
          timestamp,
        } as any,
      ],
      { session }
    );
  }

  private async _handleUpdateReferrer(session, event) {
    const { referrer, child } = event.returnValues;

    await this.ReferrerModel.findOneAndUpdate(
      { child: child.toLowerCase() },
      { referrer, child },
      { session, upsert: true }
    );
  }

  private async _handleBuy(session, event) {
    console.log("_handleBuy");
  }

  private async _handleSetMaxBuyOf(session, event) {
    const { blockNumber, transactionHash: txhash, address: presale } = event;
    const { invester, amount } = event.returnValues;

    await this.WhiteListModel.findOneAndUpdate(
      { presale, invester },
      { amount },
      { session, upsert: true }
    );
  }

  private async _handleSetTokenPrice(session, event) {
    const { blockNumber, transactionHash: txhash, address: presale } = event;
    const { price } = event.returnValues;

    await this.PreSaleListModel.findOneAndUpdate(
      {
        presale: presale.toLowerCase(),
      },
      {
        price,
      },
      {
        session,
      }
    );
  }

  private async _handleSetMinTokenBuyA(session, event) {
    const { blockNumber, transactionHash: txhash, address: presale } = event;
    const { minTokenBuyA } = event.returnValues;

    await this.PreSaleListModel.findOneAndUpdate(
      {
        presale: presale.toLowerCase(),
      },
      {
        minTokenBuyA,
      },
      {
        session,
      }
    );
  }

  private async _handleConfigLiqLock(session, event) {
    const { blockNumber, transactionHash: txhash, address: presale } = event;
    const { liqLocker } = event.returnValues;

    await this.PreSaleListModel.findOneAndUpdate(
      {
        presale: presale.toLowerCase(),
      },
      {
        liqLocker,
      },
      {
        session,
      }
    );
  }

  private async _handleConfigBuyLock(session, event) {
    console.log(`_handleConfigBuyLock`);

    const { blockNumber, transactionHash: txhash, address: presale } = event;
    const {
      buyLocker,
      buyClaimStartedAt,
      buyClaimPeriod,
      buyLockDuration,
    } = event.returnValues;

    await this.PreSaleListModel.findOneAndUpdate(
      {
        presale: presale.toLowerCase(),
      },
      {
        buyLocker,
        buyClaimStartedAt,
        buyClaimPeriod,
        buyLockDuration,
      },
      {
        session,
      }
    );
  }

  private async _handleCreatePresale(session, event) {
    console.log(`_handleCreatePresale`);
    const { blockNumber, transactionHash } = event;

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

    contractNeedSync.push(presale);

    await this.PreSaleListModel.create(
      [
        {
          token: JSON.parse(JSON.stringify(tokenData)),
          currency: JSON.parse(JSON.stringify(currencyData)),
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

    delete tokenData._id;
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
