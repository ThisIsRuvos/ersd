import { 
  Controller,
  Header,
  Post,
  Logger,
  UseGuards,
  Query,
  Get,
  GoneException,
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

  private setJSONKey(version, bundle = 'specification') {
    let key = ''
    if (version == 'ecrv3' && bundle !== '') {
      switch(bundle) {
        // case 'supplemental':
        //   key = this.appService.serverConfig.payload.ERSDV3_SUPPLEMENTAL_JSON_KEY
        case 'specification':
          key = this.appService.serverConfig.payload.ERSDV3_SPECIFICATION_JSON_KEY
      }
    }
    return key
  }

  private setXMLKey(version, bundle = 'specification') {
    let key = ''
    if (version == 'ecrv3' && bundle !== '') {
      switch(bundle) {
        // case 'supplemental':
        //   key = this.appService.serverConfig.payload.ERSDV3_SUPPLEMENTAL_JSON_KEY
        case 'specification':
          key = this.appService.serverConfig.payload.ERSDV3_SPECIFICATION_XML_KEY
      }
    }
    return key
  }

  @Post('json')
  @UseGuards(AuthGuard())
  async getJSON(@Query() queryParams) {
    // Check for deprecated versions
    if (queryParams.version === 'ecrv1' || queryParams.version === 'ecrv2') {
      throw new GoneException('eRSD Versions 1 and 2 are no longer available. Please use eRSD Version 3 (ecrv3)');
    }

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
    // Check for deprecated versions
    if (queryParams.version === 'ecrv1' || queryParams.version === 'ecrv2') {
      throw new GoneException('eRSD Versions 1 and 2 are no longer available. Please use eRSD Version 3 (ecrv3)');
    }

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

