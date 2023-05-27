import { prop, plugin, index } from "@typegoose/typegoose";
import * as timestamps from "mongoose-timestamp";

@index({ pair: 1 })
@plugin(timestamps)
export class Pair {
  @prop({ required: true, unique: true, lowercase: true })
  pair: string;

  @prop({ required: true ,lowercase: true })
  token0: string;

  @prop({ required: true,lowercase: true  })
  token1: string;

  @prop({ required: true })
  timestamp: number;

  @prop({ required: true })
  transactionHash: string;

  @prop({})
  token0Data: any;

  @prop({})
  token1Data: any;
}
