import { Injectable, Inject } from "@nestjs/common";
import { ReturnModelType, mongoose } from "@typegoose/typegoose";
import config from "config/config";
import { InjectModel, getConnectionToken } from "nestjs-typegoose";

@Injectable()
export class UtilService {
  constructor(
    @Inject(getConnectionToken()) private connection: mongoose.Connection
  ) {}

  public settingsCached: any = {};

  public async util_createSession(props: {
    execFunc?: (session: any) => void;
    options?: {
      defaultTransactionOptions: {
        writeConcern: {
          w: number;
        };
      };
    };
  }) {
    const { execFunc, options } = props;
    const session = await this.connection.startSession(options as any);
    try {
      await session.withTransaction(async () => {
        if (execFunc) {
          await execFunc(session);
        }
      });
      session.endSession();
    } catch (err) {
      session.endSession();
      throw err;
    }
  }
}
