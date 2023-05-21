import { prop, plugin, index } from '@typegoose/typegoose';
import * as timestamps from 'mongoose-timestamp';

@index({ dexAddress: 1, metamaskAddress: 1 })

@plugin(timestamps)
export class User {
    @prop({ required: true, unique: true, lowercase: true })
    dexAddress: string;

    @prop({ required: true, unique: true, lowercase: true })
    metamaskAddress: string;
}
