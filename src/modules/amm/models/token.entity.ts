import { prop, plugin, index } from "@typegoose/typegoose";
import * as timestamps from "mongoose-timestamp";

@index({ token: 1 })
@plugin(timestamps)
export class Token {
  @prop({ required: true, unique: true, lowercase: true })
  token: string;

  @prop({ required: true })
  decimals: number;

  @prop({ required: true })
  name: string;

  @prop({ required: true })
  symbol: string;
}
