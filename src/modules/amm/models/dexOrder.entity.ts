import { prop, plugin, index } from '@typegoose/typegoose';
import * as timestamps from 'mongoose-timestamp';

@index({ orderId: 1 })
@index({ owner: 1, inOrder: 1, bookId: 1, status: 1 })
@index({ owner: 1, inOrder: 1, bookId: 1 })
@index({ owner: 1, bookId: 1, status: 1 })
@index({ owner: 1, bookId: 1 })
@plugin(timestamps)
export class DexOrder {
  @prop({ required: true, lowercase: true })
  orderId: string;

  @prop({ required: true, lowercase: true })
  bookId: string;

  @prop({ required: true, lowercase: true })
  owner: string;

  @prop()
  price: number;

  @prop()
  amount: number;

  @prop()
  total: number;

  @prop({ default: 0 })
  received: number;

  @prop()
  orderType: boolean;

  @prop()
  status: 'ACTIVE' | 'FILLED' | 'CANCELLED';

  @prop({ lowercase: true })
  buyBook: string;

  @prop({ lowercase: true })
  sellBook: string;

  @prop({ default: false })
  inOrder: boolean;
}
