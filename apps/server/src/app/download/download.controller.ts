import {
  Body,
  Controller, Get, Header,
  HttpService,
  Logger,
  Post,
  Req,
  UseGuards, Response
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthRequest } from '../auth-module/auth-request';
import { AppService } from '../app.service';
import S3 from 'aws-sdk/clients/s3';
import path from "path";
import * as fs from 'fs';

@Controller('download')
export class DownloadController {
  constructor(
    private httpService: HttpService,
    private appService: AppService
  ) {}

  @Post()
  @UseGuards(AuthGuard())
  async downloadBundle(@Req() request: AuthRequest, @Body() body: any) {
    const s3client = new S3();
    const Bucket = this.appService.serverConfig.payload.Bucket;
    const Key = this.appService.serverConfig.payload.Key;
    const ResponseContentDisposition = `attachment; filename="${Key}"`;
    const params = {
      Bucket,
      Key,
      ResponseContentDisposition,
    }
    const url = await s3client.getSignedUrlPromise('getObject', params);
    return { url }
  }

  @Get('excel')
  @UseGuards(AuthGuard())
  @Header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @Header('Content-Disposition', 'attachment; filename=rctc.xlsx')
  async downloadExcel(@Response() response) {
    const rctcExcelPath = path.resolve(this.appService.serverConfig.rctcExcelPath);
    fs.createReadStream(rctcExcelPath).pipe(response);
  }
}
