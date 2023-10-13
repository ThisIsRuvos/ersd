import { 
  Controller,
  Header,
  Post,
  Logger,
  UseGuards,
  Query,
  Get,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AppService } from '../app.service';
import { AuthGuard } from '@nestjs/passport';
import S3 from 'aws-sdk/clients/s3';

@Controller('s3')
export class S3Controller {
  private readonly logger = new Logger('S3Controller');
  constructor(private appService: AppService) {
  }

  private setJSONKey(version, bundle = 'specification') { // currently defaults to specification for eRSD V2 for initial release
    let key = ''
    if(version == 'ecrv1') {
      key = this.appService.serverConfig.payload.ERSDV1_JSON_KEY
    } else if (version == 'ecrv2' && bundle !== '') {
      switch(bundle) {
        case 'supplemental':
          key = this.appService.serverConfig.payload.ERSDV2_SUPPLEMENTAL_JSON_KEY
        case 'specification':
          key = this.appService.serverConfig.payload.ERSDV2_SPECIFICATION_JSON_KEY
      }
    }
    return key
  }

  private setXMLKey(version, bundle = 'specification') { // currently defaults to specification for eRSD V2 for initial release
    let key = ''
    if(version == 'ecrv1') {
      key = this.appService.serverConfig.payload.ERSDV1_XML_KEY
    } else if (version == 'ecrv2' && bundle !== '') {
      switch(bundle) {
        case 'supplemental':
          key = this.appService.serverConfig.payload.ERSDV2_SUPPLEMENTAL_XML_KEY
        case 'specification':
          key = this.appService.serverConfig.payload.ERSDV2_SPECIFICATION_XML_KEY
      }
    }
    return key
  }

  @Post('json')
  @UseGuards(AuthGuard())
  async getJSON(@Query() queryParams) {
    const Bucket = this.appService.serverConfig.payload.Bucket;
    const Key = this.setJSONKey(queryParams.version, queryParams.bundle)
    const ResponseContentDisposition = `attachment; filename="${Key}"`;

    if (typeof Bucket === 'undefined' || Bucket === '' || Key === '') {
      const errorMessage = 'Failed to download from S3, no Bucket or Key specified'
      this.logger.error(errorMessage);
      throw Error(errorMessage);
    } 

    const s3client = new S3();

    const params = {
      Bucket,
      Key,
      ResponseContentDisposition,
    }
    // const data = await s3client.getObject(params).promise();
    // const fileData = data.Body.toString('utf-8');
    const url = await s3client.getSignedUrlPromise('getObject', params);
    // return { data: fileData, url: url };
    return { url: url };
  }

  @Post('xml')
  @UseGuards(AuthGuard())
  async getXML(@Query() queryParams) {
    const Bucket = this.appService.serverConfig.payload.Bucket;
    const Key = this.setXMLKey(queryParams.version, queryParams.bundle)
    const ResponseContentDisposition = `attachment; filename="${Key}"`;

    if (typeof Bucket === 'undefined' || Bucket === '' || Key === '') {
      const errorMessage = 'Failed to download from S3, no Bucket or Key specified'
      this.logger.error(errorMessage);
      throw Error(errorMessage);
    } 

    const s3client = new S3();

    const params = {
      Bucket,
      Key,
      ResponseContentDisposition,
    }
    const url = await s3client.getSignedUrlPromise('getObject', params);
    return {url}
  }
}

