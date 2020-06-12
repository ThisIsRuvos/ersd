import {
  Body,
  Controller, Get, Header,
  HttpService,
  Logger,
  Post,
  Req,
  UseGuards, Response,
  HttpException, HttpStatus
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthRequest } from '../auth-module/auth-request';
import { AppService } from '../app.service';
import S3 from 'aws-sdk/clients/s3';
import path from "path";
import * as fs from 'fs';

@Controller('download')
export class DownloadController {
  private readonly logger = new Logger('DownloadController');

  constructor(
    private httpService: HttpService,
    private appService: AppService
  ) {}

  @Post()
  @UseGuards(AuthGuard())
  async downloadBundle(@Req() request: AuthRequest, @Body() body: any) {
    const Bucket = this.appService.serverConfig.payload.Bucket;
    if (typeof Bucket === 'undefined' || Bucket === "") {
      return {url:'api/download/localbundle'}
    }
    else {
      const s3client = new S3();
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
  }

  @Get('localbundle')
  @UseGuards(AuthGuard())
  @Header('Content-Type', 'application/xml')
  @Header('Content-Disposition', 'attachment; filename=bundle.xml')
  async localBundle(@Response() response) {
    try {
      const bundlePath = path.resolve(this.appService.serverConfig.bundlePath);
      if (fs.existsSync(bundlePath)) {
        fs.createReadStream(bundlePath)
          .pipe(response)
      }
      else {
        throw 'File not found'
      }
    }
    catch(e) {
      this.logger.log(`Error accessing ${this.appService.serverConfig.rctcExcelPath}`)
      throw new HttpException('Not Found', HttpStatus.NOT_FOUND)
    } 
  }

  @Post('excel')
  @UseGuards(AuthGuard())
  async downloadExcel(@Req() request: AuthRequest, @Body() body: any) {
    const Bucket = this.appService.serverConfig.payload.Bucket;
    this.logger.log('HELLO' + Bucket)
    if (typeof Bucket === 'undefined' || Bucket === "") {
      return {url:'api/download/localexcel'}
    }
    else {
      const s3client = new S3();
      const Key = this.appService.serverConfig.payload.RCTCKey;
      const ResponseContentDisposition = `attachment; filename="rctc.xlsx"`;
      const params = {
        Bucket,
        Key,
        ResponseContentDisposition,
      }
      const url = await s3client.getSignedUrlPromise('getObject', params);
      return { url }
    }
  }

  @Get('localexcel')
  @UseGuards(AuthGuard())
  @Header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @Header('Content-Disposition', 'attachment; filename=rctc.xlsx')
  async localExcel(@Response() response) {
    try {
      const rctcExcelPath = path.resolve(this.appService.serverConfig.rctcExcelPath);
      if (fs.existsSync(rctcExcelPath)) {
        fs.createReadStream(rctcExcelPath)
          .pipe(response)
      }
      else {
        throw 'File not found'
      }
    }
    catch(e) {
      this.logger.log(`Error accessing ${this.appService.serverConfig.rctcExcelPath}`)
      throw new HttpException('Not Found', HttpStatus.NOT_FOUND)
    } 
  }
}
