import {
  Controller,
  Get,
  Post,
  Req,
  CacheInterceptor,
  CacheTTL,
  UseInterceptors,
  Res,
} from "@nestjs/common";
import { json, Request } from "express";
import { MyLogger } from "src/core/logger/logger.service";
import { AmmService } from "./amm.service";
import { DexMatching } from "./models/dexMatching.entity";
import { InjectModel } from "nestjs-typegoose";
import { DocumentType, ReturnModelType } from "@typegoose/typegoose";
import { get, set } from "../../utils/memoryCache";
import { getParam } from "../../utils/getParam";
// import {AmmCronService} from './ammCron.service'
const path = require("path");
@Controller("amm")
export class AmmController {
  constructor(
    @InjectModel(DexMatching)
    public readonly DexMatchingModel: ReturnModelType<typeof DexMatching>,
    private readonly logger: MyLogger,
    private readonly ammService: AmmService // private readonly cronService: AmmCronService
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

  @Get("presales")
  @UseInterceptors(CacheInterceptor)
  async presales(@Req() req) {
    const rs = await this.ammService.presaleList(req.query);
    return rs;
  }

  @Get("presale")
  @UseInterceptors(CacheInterceptor)
  async presale(@Req() req) {
    const rs = await this.ammService.presaleData(req.query);
    return rs;
  }

  @Get("token_by_presale")
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(30)
  async tokenByPresale(@Req() req) {
    const rs = await this.ammService.tokenByPresale(req.query);
    return rs;
  }

  @Get("file_import")
  async file_import(@Req() req, @Res() res) {
    var Excel = require("exceljs");
    var workbook = new Excel.Workbook();
    var worksheet = workbook.addWorksheet("WhiteList");
    worksheet.columns = [
      { header: "address", key: "address", width: 50 },
      { header: "amount", key: "amount", width: 32 },
    ];

    worksheet.addRow({ address: "0xxxxxxxx", amount: 1000 });
    worksheet.addRow({ address: "0xxxxxxxx", amount: 1000 });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=" + "template_import.xlsx"
    );
    workbook.xlsx.write(res).then(function(data) {
      res.end();
      console.log("File write done........");
    });
  }

  @Get("presale_whitelist")
  @UseInterceptors(CacheInterceptor)
  async presaleWhiteList(@Req() req) {
    const rs = await this.ammService.whiteList(req.query);
    return rs;
  }

  @Get("presale_active")
  @UseInterceptors(CacheInterceptor)
  async presaleActive(@Req() req) {
    const rs = await this.ammService.presaleActive(req.query);
    return rs;
  }

  @Get("dashboard")
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(3600)
  async dashboard(@Req() req) {
    const rs = await this.ammService.dashboard();
    return rs;
  }

  @Get("ref_statistic")
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(10)
  async ref_statistic(@Req() req) {
    const rs = await this.ammService.refStatistic(req.query);
    return rs;
  }

  @Get("volume_childs")
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(3600)
  async volume_childs(@Req() req) {
    const rs = await this.ammService.volumeChilds(req.query);
    return rs;
  }

  @Get("pairs")
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(3600)
  async pairs(@Req() req) {
    const rs = await this.ammService.pairs(req.query);
    return rs;
  }

  @Get("presale_by_token")
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(30)
  async presaleByToken(@Req() req) {
    const rs = await this.ammService.presaleByToken(req.query);
    return rs;
  }

  @Get("tokens")
  @UseInterceptors(CacheInterceptor)
  async tokens(@Req() req) {
    const rs = await this.ammService.tokensCreator(req.query);
    return rs;
  }

  // @Get("trigger_call_cron")
  // @UseInterceptors(CacheInterceptor)
  // async trigger(@Req() req) {
  //   await this.cronService.crawlTokenData();
  //   return true;
  // }

  @Get("statistic")
  @UseInterceptors(CacheInterceptor)
  async statistic(@Req() req) {
    const rs = await this.ammService.statistic();
    return rs;
  }

  @Get("topVolume")
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(600)
  async topVolume(@Req() req) {
    const rs = await this.ammService.topVolume(req.query);
    return rs;
  }

  @Get("stakings")
  @UseInterceptors(CacheInterceptor)
  async stakings(@Req() req) {
    const rs = await this.ammService.stakings(req.query);
    return rs;
  }

  @Get("presale_by_owner")
  @UseInterceptors(CacheInterceptor)
  async getLastPresaleByOwner(@Req() req) {
    const rs = await this.ammService.presaleByOwner(req.query);
    return rs;
  }
}
