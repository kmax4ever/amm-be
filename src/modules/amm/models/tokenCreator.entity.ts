import { prop, plugin, index } from "@typegoose/typegoose";
import * as timestamps from "mongoose-timestamp";

@index({ creator: 1 })
@plugin(timestamps)
export class TokenCreator {
  @prop({ required: true, lowercase: true })
  token: string;
  @prop({ required: true, lowercase: true })
  creator: string;
  @prop()
  timestamp: number;
  @prop({ lowercase: true })
  txHash: string;

  @prop()
  name: string;

  @prop()
  symbol: string;

  @prop()
  decimals: string;
}
