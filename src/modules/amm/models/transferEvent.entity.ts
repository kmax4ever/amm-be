import { prop, plugin, index } from '@typegoose/typegoose';
import * as timestamps from 'mongoose-timestamp';

@index({ contractAddress: 1, from: 1, to: 1 })
@index({ contractAddress: 1, to: 1 })
@plugin(timestamps)
export class TransferEvent {
  @prop({ required: true, lowercase: true })
  from: string;

  @prop({ required: true, lowercase: true })
  value: string;

  @prop({ required: true, lowercase: true })
  contractAddress: string;

  @prop({ lowercase: true })
  to: string;

  @prop({ lowercase: true })
  txHash: string;
}
