import { prop, plugin, index } from "@typegoose/typegoose";
import * as timestamps from "mongoose-timestamp";

@index({ token: 1 })
@index({ sender: 1 })
@plugin(timestamps)
export class ClaimHistory {
  @prop({ lowercase: true })
  lockId?: string;

  @prop({ required: true, lowercase: true })
  owner: string;
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
  duration: number;

  @prop({ lowercase: true })
  txhash: string;

  @prop()
  claimStartedAt: number;

  @prop()
  claimPeriod: number;

  @prop()
  amount: string;
  @prop()
  claimAmount: string;
  @prop()
  timestamp: number;
}
