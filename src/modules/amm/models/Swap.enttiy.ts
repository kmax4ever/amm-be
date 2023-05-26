import { prop, plugin, index } from "@typegoose/typegoose";
import * as timestamps from "mongoose-timestamp";

@index({ referrer: 1 })
@plugin(timestamps)
export class Swap {
  @prop({ required: true, lowercase: true })
  sender: string;
  @prop({ required: true, lowercase: true })
  to: string;

  @prop()
  amount0In?: string;
  @prop()
  amount1In?: string;
  @prop()
  amount0Out?: string;
  @prop()
  amount1Out?: string;

  @prop()
  timestamp: number;
  @prop()
  transactionHash?: string;

  @prop()
  ethUSD: number;
  @prop()
  volumeUSD: number;
}
