import { prop, plugin, index } from "@typegoose/typegoose";
import * as timestamps from "mongoose-timestamp";

@plugin(timestamps)
export class Statistic {
  @prop({})
  tokenData: any;
  @prop({})
  volumeStatistic?: Array<any>;
}
