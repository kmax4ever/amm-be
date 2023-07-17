import { prop, plugin, index } from "@typegoose/typegoose";
import * as timestamps from "mongoose-timestamp";

@index({ referrer: 1 })
@plugin(timestamps)
export class Referrer {
  @prop({ required: true, lowercase: true })
  referrer: string;

  @prop({ required: true, lowercase: true })
  child: string;
  @prop({ lowercase: true })
  token?: string;
}
