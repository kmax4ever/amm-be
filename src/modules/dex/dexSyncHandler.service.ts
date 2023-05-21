import { Injectable } from '@nestjs/common';
import { ReturnModelType } from '@typegoose/typegoose';
import { InjectModel } from 'nestjs-typegoose';
import { Web3EventType } from 'src/core/syncCore.service';
import { SyncHandlerService } from 'src/core/syncHandler.service';
import { Event } from 'src/models/event.entity';
import { DexMatching } from './models/dexMatching.entity';
import { DexOrder } from './models/dexOrder.entity';
import crypto from 'src/utils/crypto';
import { dateFromNumber, toBigNumber } from 'src/utils/helper';
import { ORDER_STATUS } from 'config/constants';
import {
  getOrderType,
  CONTRACT_SYNC
} from './config/dexConfig';
import { TransferEvent } from './models/transferEvent.entity';

@Injectable()
export class DexSyncHandler extends SyncHandlerService {
  constructor(
    @InjectModel(Event)
    EventModel: ReturnModelType<typeof Event>,

    //====module models=====
    @InjectModel(DexMatching)
    public readonly DexMatchingModel: ReturnModelType<typeof DexMatching>,
    @InjectModel(DexOrder)
    public readonly DexOrderModel: ReturnModelType<typeof DexOrder>,
    @InjectModel(TransferEvent)
    public readonly TransferEventModel: ReturnModelType<typeof TransferEvent>,
  ) {
    super(EventModel);
    this.contracts = CONTRACT_SYNC();
    this.moduleName = 'Dex';
  }

  public async initDb() {
    try {
      await this.DexMatchingModel.createCollection();
      await this.DexOrderModel.createCollection();
      await this.TransferEventModel.createCollection();
    } catch (err) { }
  }

  public async onResetVersion() {
    await this.DexMatchingModel.deleteMany({});
    await this.DexOrderModel.deleteMany({});
    await this.TransferEventModel.deleteMany({});
  }

  public async processEvents(session: any, events: Web3EventType[]) {
    for (const event of events) {
      switch (event.event) {
        case 'Matching':
          await this.handleMatching(session, event);
          break;
        case 'CreateOrder':
          await this.handleCreateOrder(session, event);
          break;
        case 'UpdateOrder':
          await this.handleUpdateOrder(session, event);
          break;
        case 'CancelOrder':
          await this.handleCancelOrder(session, event);
          break;
        case 'RemoveOrder':
          await this.handleRemoveOrder(session, event);
          break;
        case 'TokenReceived':
          await this.handleTokenReceived(session, event);
          break;

        case 'Transfer':
          await this.handleTransferEvent(session, event);
          break;

        default:
          break;
      }
    }
  }

  private async handleTransferEvent(session: any, event: Web3EventType) {
    const { transactionHash, address } = event;
    const { value, from, to } = event.returnValues;
    //console.log(event);
    const historyTranfer = {
      value,
      from,
      to,
      contractAddress: address,
      txHash: transactionHash,
    };

    const doc = await this.TransferEventModel.create([historyTranfer as any], {
      session,
    });

    const historyChange = [
      { dbModelName: 'transferevents', before: null, after: doc },
    ];
    await this._saveEvent(event, historyChange, session);
  }

  private async handleTokenReceived(session: any, event: Web3EventType) {
    const { _orderId, _amount } = event.returnValues;

    const order = await this.DexOrderModel.findOne(
      { orderId: _orderId },
      {},
      { session },
    );

    if (!order) {
      console.log('xxxx orderId not found :', _orderId);
      return;
    }

    const newReceived = toBigNumber(order.received.toString()).plus(
      toBigNumber(crypto.fromWei(_amount)),
    );
    const param = {
      orderId: _orderId,
      data: {
        received: Number(newReceived),
      },
      session,
    };

    await this._updateOrder(param);

    const historyChange = [{ dbModelName: 'dexorders', before: { ...order } }];
    await this._saveEvent(event, historyChange, session);
  }

  private async handleRemoveOrder(session: any, event: Web3EventType) {
    const { _orderId } = event.returnValues;

    const order = await this.DexOrderModel.findOne(
      { orderId: _orderId },
      {},
      { session },
    );

    if (!order) {
      console.log('xxxx orderId not found :', _orderId);
      return;
    }

    const param = {
      orderId: _orderId,
      data: {
        amount: 0,
        status: ORDER_STATUS.FILLED,
        inOrder: false,
      },
      session,
    };

    await this._updateOrder(param);

    const historyChange = [{ dbModelName: 'dexorders', before: { ...order } }];
    await this._saveEvent(event, historyChange, session);
  }

  private async handleCancelOrder(session: any, event: Web3EventType) {
    const { _orderId } = event.returnValues;

    const order = await this.DexOrderModel.findOne(
      { orderId: _orderId },
      {},
      { session },
    );

    if (!order) {
      console.log('xxxx orderId not found :', _orderId);
      return;
    }

    const param = {
      orderId: _orderId,
      data: {
        status: ORDER_STATUS.CANCELLED,
        inOrder: false,
      },
      session,
    };

    await this._updateOrder(param);

    const historyChange = [{ dbModelName: 'dexorders', before: { ...order } }];
    await this._saveEvent(event, historyChange, session);
  }

  private async handleUpdateOrder(session: any, event: Web3EventType) {
    const { _orderId, _amount } = event.returnValues;
    const param: any = {
      orderId: _orderId,
      data: {
        inOrder: true,
      },
      session,
    };
    param.data.amount = crypto.fromWei(_amount);

    if (this.utilIsTinyAmount(param.data.amount)) {
      param.data.amount = 0;
      param.data.status = ORDER_STATUS.FILLED;
      param.data.inOrder = false;
    }

    const order = await this.DexOrderModel.findOne(
      { orderId: _orderId },
      {},
      { session },
    );

    if (!order) {
      console.log('xxxx orderId not found :', _orderId);
      return;
    }

    await this._updateOrder(param);

    const historyChange = [{ dbModelName: 'dexorders', before: { ...order } }];
    await this._saveEvent(event, historyChange, session);
  }

  private async _updateOrder(param) {
    const { orderId, data, session } = param;
    await this.DexOrderModel.updateOne({ orderId }, data, { session });
  }

  private utilIsTinyAmount(amount: any) {
    return Number(amount) < 1e-8;
  }

  private async handleCreateOrder(session: any, event: Web3EventType) {
    const {
      _orderId,
      _book,
      _owner,
      _price,
      _amount,
      _createdAt,
    } = event.returnValues;
    // console.log('xxx create order', data);
    const order = {
      orderId: _orderId,
      bookId: _book,
      owner: _owner,
      price: +crypto.fromWei(_price),
      amount: +crypto.fromWei(_amount),
      total: +crypto.fromWei(_amount),
      status: ORDER_STATUS.ACTIVE,
      received: 0,
      inOrder: true,
      orderType: getOrderType(_book),
      createdAt: dateFromNumber(_createdAt),
    };
    const _order = await this.DexOrderModel.findOne(
      {
        orderId: _orderId,
      },
      {},
      { session },
    );
    if (_order) {
      return;
    }

    const doc = await this.DexOrderModel.create([order as any], { session });

    const historyChange = [
      { dbModelName: 'dexorders', before: null, after: doc },
    ];
    await this._saveEvent(event, historyChange, session);
  }

  private async handleMatching(session: any, event: Web3EventType) {
    const {
      _sellBook,
      _buyBook,
      _price,
      _amount,
      _orderType,
      _createdAt,
    } = event.returnValues;
    const matching = {
      sellBook: _sellBook,
      buyBook: _buyBook,
      price: crypto.fromWei(_price),
      amount: crypto.fromWei(_amount),
      orderType: _orderType,
      createdAt: dateFromNumber(_createdAt),
    };

    const doc = await this.DexMatchingModel.create([matching], { session });
    const historyChange = [
      { dbModelName: 'dexmatchings', before: null, after: doc },
    ];
    await this._saveEvent(event, historyChange, session);
  }
}
