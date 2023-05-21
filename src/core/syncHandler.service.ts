import { Injectable } from '@nestjs/common';
import { ReturnModelType } from '@typegoose/typegoose';
import { InjectModel } from 'nestjs-typegoose';
import { Event } from 'src/models/event.entity';
import { web3Default, Web3EventType, Web3LogType } from './syncCore.service';

export interface Contract {
  address: string;
  abi: any;
}

@Injectable()
export class SyncHandlerService {
  //===== SETTINGS ======
  public moduleName = '';

  //@HARDFOLK: old contractAddress
  public dexVer1Contracts: Contract[] = [];

  public contracts: Contract[] = [];

  constructor(
    @InjectModel(Event)
    public readonly EventModel: ReturnModelType<typeof Event>,
  ) {}

  public async initDb() {
    //@TODO: override this function
    return;
  }

  public async processEvents(session: any, events: Web3EventType[]) {
    return;
    //@TODO: need override this function
  }

  public async onResetVersion() {
    return;
    //@TODO: need override this function
  }

  public async processLogs(session: any, logs: Web3LogType[]) {
    const events: Web3EventType[] = [];
    for (const log of logs) {
      const event = this.decodeLogPair(log);
      if (event) {
        events.push(event);
      }
    }

    await this.processEvents(session, events);
  }

  public decodeLogPair(log: Web3LogType): Web3EventType | null {
    try {
      const eventAbisMapWithSignature: any = {};
      for (const contract of this.contracts) {
        for (const abi of contract.abi) {
          if (abi.type === 'event') {
            const signature = web3Default.eth.abi.encodeEventSignature(abi);
            eventAbisMapWithSignature[signature] = abi;
          }
        }
      }
      const signature = log.topics[0];
      const eventAbi = eventAbisMapWithSignature[signature];
      if (!eventAbi) {
        return;
      } else {
        const { inputs, anonymous, name } = eventAbi;
        const hexString = log.data;
        if (!anonymous) {
          log.topics.splice(0, 1);
        }
        const data = web3Default.eth.abi.decodeLog(
          inputs,
          hexString,
          log.topics,
        );

        return {
          address: log.address,
          blockHash: log.blockHash,
          blockNumber: log.blockNumber,
          event: name,
          returnValues: data,
          transactionHash: log.transactionHash,
          transactionIndex: log.transactionIndex,
        };
      }
    } catch (error) {
      console.log(error);

      return;
    }
  }

  public async _saveEvent(
    event: Web3EventType,
    historyChange: { dbModelName: string; before: any; after?: any }[],
    session,
  ) {
    await this.EventModel.create(
      [
        {
          blockNumber: event.blockNumber,
          contractAddress: event.address,
          data: event,
          changeHistory: historyChange,
        },
      ],
      { session },
    );
  }
}
