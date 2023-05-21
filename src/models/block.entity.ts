import { prop, plugin, index } from '@typegoose/typegoose';
import * as timestamps from 'mongoose-timestamp';

@index({ blockNumber: 1 })
@plugin(timestamps)
export class Block {
  @prop()
  blockNumber: number;

  @prop()
  hash: string;
}
