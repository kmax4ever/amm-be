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

@index({ presaleAddress: 1 })
@plugin(timestamps)
export class PreSaleList {
  @prop({ required: true, unique: true, lowercase: true })
  presale: string;

  @prop({ lowercase: true })
  liqLocker?: string;

  @prop({ lowercase: true })
  buyLocker?: string;

  @prop({ required: true, lowercase: true })
  owner: string;
  @prop({ required: true })
  token: Token;

  @prop({ required: true })
  currency: Token;

  @prop({ required: true })
  liqClaimStartedAt: number;

  @prop({ required: true })
  liqClaimPeriod: number;

  @prop({ required: true })
  liqLockDuration: number;

  @prop()
  timestamp: number;

  @prop()
  txhash: string;

  @prop()
  price?: string;
  @prop()
  minTokenBuyA?: string;

  @prop()
  buyClaimStartedAt?: number;

  @prop()
  buyClaimPeriod?: number;

  @prop()
  buyLockDuration?: number;

  @prop()
  startedAt?: number;

  @prop()
  endAtdAt?: number;

  @prop()
  totalSold?: string;
}
