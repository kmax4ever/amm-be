import { prop, plugin, index } from "@typegoose/typegoose";
import * as timestamps from "mongoose-timestamp";

@index({ dexAddress: 1, metamaskAddress: 1 })
@plugin(timestamps)
export class WhiteList {
  @prop({ required: true, lowercase: true })
  invester: string;

  @prop({ required: true, lowercase: true })
  presale: string;
  @prop({})
  amount?: string;
}
