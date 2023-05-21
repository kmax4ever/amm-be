import {
  prop,
  plugin,
  arrayProp,
  index,
  modelOptions,
  Severity,
} from '@typegoose/typegoose';
import * as timestamps from 'mongoose-timestamp';

@modelOptions({
  options: {
    allowMixed: Severity.ALLOW,
  },
})
export class ChangeHistoryItem {
  @prop()
  dbModelName: string;

  @prop({ required: false })
  before?: Record<string, any>;

  @prop()
  after?: Record<string, any>;
}

@index({ blockNumber: 1 })
@modelOptions({
  options: {
    allowMixed: Severity.ALLOW,
  },
})
@plugin(timestamps)
export class Event {
  @prop()
  contractAddress: string;

  @prop()
  data: Record<string, any>;

  @prop()
  blockNumber: number;

  @arrayProp({ items: ChangeHistoryItem })
  changeHistory: ChangeHistoryItem[];
}
