import { prop, plugin, index } from "@typegoose/typegoose";
import * as timestamps from "mongoose-timestamp";

@index({ token: 1 })
@index({ sender: 1 })
@index({ startedAt: 1, endedAt: 1, nextTimeUpdateTaxAtSec: 1 })
@plugin(timestamps)
export class Listing {
  @prop({ required: true, lowercase: true })
  sender: string;

  @prop({ required: true, lowercase: true })
  token: string;

  @prop()
  symbol?: string;
  @prop()
  name?: string;

  @prop()
  decimal?: string;

  @prop()
  tax?: number;

  @prop()
  startedAt: number;
  @prop()
  endedAt: number;

  @prop()
  duration: number;

  @prop({ lowercase: true })
  txhash: string;

  @prop({ default: false })
  isDisable: boolean;

  @prop({ default: 0 })
  nextTimeUpdateTaxAtSec: number;
}
