import { prop, plugin, index } from "@typegoose/typegoose";
import * as timestamps from "mongoose-timestamp";

class Token {
  @prop({ required: true, lowercase: true })
  address: string;

  @prop({ required: true })
  decimals: number;

  @prop({ required: true })
  name: string;

  @prop({ required: true })
  symbol: string;

  @prop({ required: true })
  token: string;
}

@index({ staking: 1 })
@plugin(timestamps)
export class Staking {
  @prop({ required: true, unique: true, lowercase: true })
  staking: string;

  @prop({ required: true, lowercase: true })
  creator: string;

  @prop({ required: true, lowercase: true })
  distributor: string;

  @prop({ required: true })
  lockDuration: number;

  @prop({ required: true })
  timestamp: number;

  @prop({ required: true })
  rps: string;

  @prop({ required: true })
  distributionStartedAt: number;
  @prop({ required: true, default: false })
  isApproved: boolean;

  @prop({ required: true, lowercase: true })
  transactionHash: string;

  @prop({ required: true })
  depositToken: Token;

  @prop({ required: true })
  rewardToken: Token;
}
