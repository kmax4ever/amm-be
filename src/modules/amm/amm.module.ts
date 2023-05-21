import { Module } from "@nestjs/common";
import { AmmController } from "./amm.controller";
import { AmmService } from "./amm.service";
import { CoreModule } from "src/core/core.module";
import { AmmCronService } from "./ammCron.service";
import { UtilService } from "src/core/utils.service";

const extraServices = [];

if (process.env.IS_RUN_CRON === `true`) {
  extraServices.push(AmmCronService);
}

@Module({
  imports: [CoreModule],
  exports: [],
  controllers: [AmmController],
  providers: [AmmService, UtilService, ...extraServices],
})
export class AmmModule {}
