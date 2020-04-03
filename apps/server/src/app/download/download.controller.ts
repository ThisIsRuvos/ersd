import {
  Body,
  Controller,
  HttpService,
  Logger,
  Post,
  Req,
  UseGuards
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthRequest } from '../auth-module/auth-request';
import { AppService } from '../app.service';
import S3 from 'aws-sdk/clients/s3';

@Controller('download')
export class DownloadController {
  constructor(
    private httpService: HttpService,
    private appService: AppService
  ) {}

  @Post()
  @UseGuards(AuthGuard())
  async download(@Req() request: AuthRequest, @Body() body: any) {
    console.log('request body: ', body);
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
}
