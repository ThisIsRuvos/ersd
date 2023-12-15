import {
  Body,
  Controller,
  Get,
  Header,
  HttpException,
  HttpStatus,
  Logger,
  Post,
  Query,
  Req,
  Response,
  UseGuards
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AuthGuard } from '@nestjs/passport';
import type { AuthRequest } from '../auth-module/auth-request';
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
    if (typeof Bucket === 'undefined' || Bucket === "") {
      return { url:'/api/download/localjsonbundle' }
    } 
    const s3client = new S3();
    const Key = this.appService.serverConfig.payload.JSONKey;

    const headParams = {
      Bucket,
      Key,
    }

    const data = await s3client.headObject(headParams).promise();
    const metaData = data.Metadata;
    this.logger.log(`metadata: ${JSON.stringify(metaData, null, 2)}\n\n data: ${JSON.stringify(data, null, 2)}`)
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
  async downloadExcel() {
    const Bucket = this.appService.serverConfig.payload.Bucket;
      const s3client = new S3();

      const Key = this.appService.serverConfig.payload.RCTCKey;
      const ResponseContentDisposition = `attachment; filename="rctc.zip"`;

      const params = {
        Bucket,
        Key,
        ResponseContentDisposition,
      }
      const url = await s3client.getSignedUrlPromise('getObject', params);
      return {url}
  }


  // Not used atm
  @Post('rctc_release')
  @UseGuards(AuthGuard())
  async downloadRCTCReleaseSpreadsheet() {
    const Bucket = this.appService.serverConfig.payload.Bucket;
      const s3client = new S3();

      const Key = this.appService.serverConfig.payload.RCTC_RELEASE_SPREADSHEET_KEY;
      const ResponseContentDisposition = `attachment; filename="RCTC_Release.xlsx"`;

      const params = {
        Bucket,
        Key,
        ResponseContentDisposition,
      }
      const url = await s3client.getSignedUrlPromise('getObject', params);
      return {url}
  }

  // this needs to be changed to get both files v2 and v3
  @Post('change-preview-json')
  @UseGuards(AuthGuard())
  async downloadReleaseCandidateV1DraftJSON(@Query() queryParams) {
    const { version } = queryParams;


    const Bucket = this.appService.serverConfig.payload.Bucket;
      const s3client = new S3();
      let Key, ResponseContentDisposition;

      if (version === "ersdv2-draft") {
        Key = this.appService.serverConfig.payload.ERSDV2_CHANGE_PREVIEW_JSON_KEY;
        ResponseContentDisposition = `attachment; filename="eRSDv2_specification_bundle_draft.json"`;
      } else if (version === "ersdv3-draft") {
        Key = this.appService.serverConfig.payload.ERSDV3_CHANGE_PREVIEW_JSON_KEY;
        ResponseContentDisposition = `attachment; filename="eRSDv3_specification_bundle_draft.json"`;
      }

      // const Key = this.appService.serverConfig.payload.ERSDV2_CHANGE_PREVIEW_JSON_KEY;
      // const ResponseContentDisposition = `attachment; filename="eRSDv2_specification_bundle_draft.json"`;

      const params = {
        Bucket,
        Key,
        ResponseContentDisposition,
      }
      const url = await s3client.getSignedUrlPromise('getObject', params);
      return {url}
  }

    // this needs to be changed to get both files v2 and v3
  @Post('change-preview-xml')
  @UseGuards(AuthGuard())
  async downloadReleaseCandidateV1DraftXML(@Query() queryParams) {
    const { version } = queryParams;

    const Bucket = this.appService.serverConfig.payload.Bucket;
      const s3client = new S3();

      let Key, ResponseContentDisposition;

      if (version === "ersdv2-draft") {
        Key = this.appService.serverConfig.payload.ERSDV2_CHANGE_PREVIEW_XML_KEY;
        ResponseContentDisposition = `attachment; filename="eRSDv2_specification_bundle_draft.xml"`;
      } else if (version === "ersdv3-draft") {
        Key = this.appService.serverConfig.payload.ERSDV3_CHANGE_PREVIEW_XML_KEY;
        ResponseContentDisposition = `attachment; filename="eRSDv3_specification_bundle_draft.xml"`;
      }

      const params = {
        Bucket,
        Key,
        ResponseContentDisposition,
      }
      const url = await s3client.getSignedUrlPromise('getObject', params);
      return {url}

      // const Key1 = this.appService.serverConfig.payload.ERSDV2_CHANGE_PREVIEW_XML_KEY;
      // const Key2 = this.appService.serverConfig.payload.ERSDV3_CHANGE_PREVIEW_XML_KEY;
      // const ResponseContentDisposition1 = `attachment; filename="eRSDv2_specification_bundle_draft.xml"`;
      // const ResponseContentDisposition2 = `attachment; filename="eRSDv3_specification_bundle_draft.xml"`;

      // const params1 = { Bucket, Key: Key1, ResponseContentDisposition1 };
      // const params2 = { Bucket, Key: Key2,  ResponseContentDisposition2 };

      // const urlV2 = await s3client.getSignedUrlPromise('getObject', params1);
      // const urlV3 = await s3client.getSignedUrlPromise('getObject', params2);
      // return {urlV2, urlV3}
  }

  @Post('release_notes')
  @UseGuards(AuthGuard())
  async downloadNotes(@Query() queryParams) {
    const { version } = queryParams;
    const Bucket = this.appService.serverConfig.payload.Bucket;
    const s3client = new S3();
    let Key, ResponseContentDisposition;
  
    if (version === "ersdv1") {
      Key = this.appService.serverConfig.payload.ERSD_RELEASE_DESCRIPTION_V1_KEY;
      ResponseContentDisposition = `attachment; filename="eRSDv1_specification_release_description.txt"`;
    } else if (version === "ersdv2") {
      Key = this.appService.serverConfig.payload.ERSD_RELEASE_DESCRIPTION_V2_KEY;
      ResponseContentDisposition = `attachment; filename="eRSDv2_specification_release_description.txt"`;
    } else if (version === "ersdv3") {
      Key = this.appService.serverConfig.payload.ERSD_RELEASE_DESCRIPTION_V3_KEY;
      ResponseContentDisposition = `attachment; filename="eRSDv3_specification_release_description.txt"`;
    }
  
    const params = {
      Bucket,
      Key,
      ResponseContentDisposition,
    };
  
    const url = await s3client.getSignedUrlPromise('getObject', params);
    return { url };
  }
  

@Post('change_logs')
@UseGuards(AuthGuard())
async downloadChangeLogs() {
  const Bucket = this.appService.serverConfig.payload.Bucket;

  const s3client = new S3();
  const Key = this.appService.serverConfig.payload.RCTC_CHANGE_LOG_KEY;
  const ResponseContentDisposition = `attachment; filename="RCTC_Change_Log.xlsx"`;

  const params = {
    Bucket,
    Key,
    ResponseContentDisposition,
  }
  const url = await s3client.getSignedUrlPromise('getObject', params);
  return {url}
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
