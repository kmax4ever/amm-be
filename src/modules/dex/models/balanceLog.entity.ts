import {
  index, plugin, prop
} from '@typegoose/typegoose';
import * as timestamps from 'mongoose-timestamp';

@index({ address: 1 })
@plugin(timestamps)
export class BalanceLog {
  @prop({ unique: true })
  address: string;

  @prop()
  wdrk: number;
  @prop()
  weth: number;
  @prop()
  wbtc: number;
  @prop()
  wtrx: number;
  @prop()
  wusdt: number;
  @prop()
  drd: number;
  @prop()
  drx: number;
}
