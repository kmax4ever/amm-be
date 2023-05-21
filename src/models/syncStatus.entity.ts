import { prop, plugin } from '@typegoose/typegoose';
import * as timestamps from 'mongoose-timestamp';

@plugin(timestamps)
export class SyncStatus {
  @prop()
  version: number;

  @prop()
  lastBlockSynced: number;
}
