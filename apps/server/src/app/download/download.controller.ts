import {
  Body,
  Controller,
  Get,
  Header,
  HttpException,
  HttpService,
  HttpStatus,
  Logger,
  Post,
  Req,
  Response,
  UseGuards
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
  ) {
  }

  @Post("xmlbundle")
  @UseGuards(AuthGuard())
  async downloadXmlBundle(@Req() request: AuthRequest, @Body() body: any) {
    return {
      url:'/api/download/localxmlbundle'
    }
  }

  @Post("jsonbundle")
  @UseGuards(AuthGuard())
  @Header('Content-Type', 'application/json')
  @Header('Content-Disposition', 'attachment; filename=bundle.json')
  async downloadJsonBundle(@Req() request: AuthRequest, @Body() body: any) {
    const Bucket = this.appService.serverConfig.payload.Bucket;
    this.logger.log('HELLO' + Bucket)
    if (typeof Bucket === 'undefined' || Bucket === "") {
      return { url:'/api/download/localjsonbundle' }
    } 
    const s3client = new S3({ 
      s3ForcePathStyle: true,
      accessKeyId: "S3RVER",
      secretAccessKey: "S3RVER",
      endpoint: 'http://localhost:4568'
    });
    const Key = this.appService.serverConfig.payload.JSONKey;

    const headParams = {
      Bucket,
      Key,
    }
    const data = await s3client.getObject(headParams).promise();
    const parsedJSON = JSON.parse(data.Body.toString('utf-8'))
    console.log(parsedJSON)
    return parsedJSON
  }


  @Get('localxmlbundle')
  @UseGuards(AuthGuard())
  @Header('Content-Type', 'application/xml')
  @Header('Content-Disposition', 'attachment; filename=bundle.xml')
  async localxmlBundle() {
    const xmlBundleUrl = `${this.appService.serverConfig.fhirServerBase}/Bundle?_sort=-_lastUpdated&_count=1`

    try {
      const bundleResponse = await this.httpService.get(xmlBundleUrl, {
        headers: {
          Accept: 'application/xml'
        }
      }).toPromise();
      return bundleResponse.data;
    } catch(e) {
      this.logger.log(`Error accessing ${xmlBundleUrl}`)
      throw new HttpException('Not Found', HttpStatus.NOT_FOUND)
    }
  }

  @Get('localjsonbundle')
  @UseGuards(AuthGuard())
  @Header('Content-Type', 'application/json')
  @Header('Content-Disposition', 'attachment; filename=bundle.json')
  async localjsonBundle() {
    const jsonBundleUrl = `${this.appService.serverConfig.fhirServerBase}/Bundle?_sort=-_lastUpdated&_count=1`

    try {
      const bundleResponse = await this.httpService.get(jsonBundleUrl, {
        headers: {
          Accept: 'application/json'
        }
      }).toPromise();
      return bundleResponse.data;
    } catch(e) {
      this.logger.log(`Error accessing ${jsonBundleUrl}`)
      throw new HttpException('Not Found', HttpStatus.NOT_FOUND)
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
      } else {
        throw new Error('File not found');
      }
    } catch (e) {
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
      return {url: 'api/download/localexcel'}
    } else {
      const s3client = new S3();
      const Key = this.appService.serverConfig.payload.RCTCKey;


      const headParams = {
        Bucket,
        Key,
      }

      const data = await s3client.headObject(headParams).promise();
      const metaData = data.Metadata;

      const fileName = metaData['filename'] || Key;
      const ResponseContentDisposition = `attachment; filename="${fileName}"`;

      const params = {
        Bucket,
        Key,
        ResponseContentDisposition,
      }
      const url = await s3client.getSignedUrlPromise('getObject', params);
      return {url}
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
      } else {
        throw new Error('File not found')
      }
    } catch (e) {
      this.logger.log(`Error accessing ${this.appService.serverConfig.rctcExcelPath}`)
      throw new HttpException('Not Found', HttpStatus.NOT_FOUND)
    }
  }
}
