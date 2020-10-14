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
import {Readable} from "stream";

@Controller('download')
export class DownloadController {
  private readonly logger = new Logger('DownloadController');


  constructor(
    private httpService: HttpService,
    private appService: AppService
  ) {}

  @Post("xmlbundle")
  @UseGuards(AuthGuard())
  async downloadXmlBundle(@Req() request: AuthRequest, @Body() body: any) {
    return {
      url:'/api/download/localxmlbundle'
    }
  }

  @Post("jsonbundle")
  @UseGuards(AuthGuard())
  async downloadJsonBundle(@Req() request: AuthRequest, @Body() body: any) {
    return {
      url:'/api/download/localjsonbundle'
    }
  }


  @Get('localxmlbundle')
  @UseGuards(AuthGuard())
  @Header('Content-Type', 'application/xml')
  @Header('Content-Disposition', 'attachment; filename=bundle.xml')
  async localxmlBundle(@Response() response) {


    const http = require('http');

    try {
      const options = {
        hostname: 'hapi-fhir',
        port: 8080,
        path: '/hapi-fhir-jpaserver/fhir/Bundle?_sort=-_lastUpdated&_count=1',
        method: 'GET',
        headers: {
          Accept: 'application/xml'
        }
      };

      const req = http.request(options, function(res) {
        res.setEncoding('utf8');
        // let data = "";
        res.on('readable', readableOutput => {
          let stream = require("stream")
          let readable = new stream.PassThrough()
          let data = res.read()
          console.log('first', data);
          readable.write(data);
          readable.end();
          readable.pipe(response)
        })
      });

      req.on('error', function(e) {
        console.log('problem with request: ' + e.message);
      });

      req.end();

    }
    catch(e) {
      this.logger.log(`Error accessing ${this.appService.serverConfig.rctcExcelPath}`)
      throw new HttpException('Not Found', HttpStatus.NOT_FOUND)
    }
  }

  @Get('localjsonbundle')
  @UseGuards(AuthGuard())
  @Header('Content-Type', 'application/json')
  @Header('Content-Disposition', 'attachment; filename=bundle.json')
  async localjsonBundle(@Response() response) {
    const http = require('http');

    try {
      const options = {
        hostname: 'hapi-fhir',
        port: 8080,
        path: '/hapi-fhir-jpaserver/fhir/Bundle?_sort=-_lastUpdated&_count=1',
        method: 'GET',
        headers: {
          Accept: 'application/json'
        }
      };

      const req = http.request(options, function(res) {
        res.setEncoding('utf8');
        // let data = "";
        res.on('readable', readableOutput => {
          let stream = require("stream")
          let readable = new stream.PassThrough()
          let data = res.read()
          console.log('first', data);
          readable.write(data);
          readable.push(null);
          readable.end();
          readable.pipe(response);
        })
      });

      req.on('error', function(e) {
        console.log('problem with request: ' + e.message);
      });

      req.end();

    }
    catch(e) {
      this.logger.log(`Error accessing ${this.appService.serverConfig.rctcExcelPath}`)
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
        throw 'File not found'
      }
    }
    catch(e) {
      this.logger.log(`Error accessing ${this.appService.serverConfig.rctcExcelPath}`)
      throw new HttpException('Not Found', HttpStatus.NOT_FOUND)
    }
  }

  getReadableStream(buffer: Buffer): Readable {
    const stream = new Readable();
    stream.push(buffer);
    return stream;
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
