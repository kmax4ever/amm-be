import {
  Controller,
  Get,
  Post,
  Req,
  CacheInterceptor,
  CacheTTL,
  UseInterceptors,
} from "@nestjs/common";
import { json, Request } from "express";
import { MyLogger } from "src/core/logger/logger.service";
import { AmmService } from "./amm.service";
import { DexMatching } from "./models/dexMatching.entity";
import { InjectModel } from "nestjs-typegoose";
import { DocumentType, ReturnModelType } from "@typegoose/typegoose";
import { get, set } from "../../utils/memoryCache";
import { getParam } from "../../utils/getParam";
@Controller("amm")
export class AmmController {
  constructor(
    @InjectModel(DexMatching)
    public readonly DexMatchingModel: ReturnModelType<typeof DexMatching>,
    private readonly logger: MyLogger,
    private readonly ammService: AmmService
  ) {
    this.logger.setContext("AmmController");
  }

  @Get("tokens_listing")
  @UseInterceptors(CacheInterceptor)
  async tokens_listing(@Req() req) {
    const rs = await this.ammService.listings(req.query);
    return rs;
  }

  @Get("tokens_lock")
  @UseInterceptors(CacheInterceptor)
  async tokens_lock(@Req() req) {
    const rs = await this.ammService.locks(req.query);
    return rs;
  }

  @Get("token")
  @UseInterceptors(CacheInterceptor)
  async token(@Req() req) {
    const rs = await this.ammService.getToken(req.query);
    return rs;
  }

  @Get("claim_history")
  @UseInterceptors(CacheInterceptor)
  async claim_history(@Req() req) {
    const rs = await this.ammService.claimHistory(req.query);
    return rs;
  }
}
