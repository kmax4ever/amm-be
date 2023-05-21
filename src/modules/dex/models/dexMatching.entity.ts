import { prop, plugin, index } from '@typegoose/typegoose';
import * as timestamps from 'mongoose-timestamp';

@index({ sellBook: 1, buyBook: 1, createdAt: 1 })
@plugin(timestamps)
export class DexMatching {
  @prop({ required: true, lowercase: true })
  price: string;

  @prop({ required: true, lowercase: true })
  amount: string;

  @prop()
  orderType: boolean;

  @prop({ lowercase: true })
  buyBook: string;

  @prop({ lowercase: true })
  sellBook: string;
}
