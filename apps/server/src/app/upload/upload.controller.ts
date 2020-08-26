import {Body, Controller, HttpService, Logger, Post, Req, UseGuards} from '@nestjs/common';
import {AuthGuard} from '@nestjs/passport';
import {AuthRequest} from '../auth-module/auth-request';
import {Constants} from '../../../../../libs/ersdlib/src/lib/constants';
import {IUploadRequest} from '../../../../../libs/ersdlib/src/lib/upload-request';
import {Fhir} from 'fhir/fhir';
import {IBundle} from '../../../../../libs/ersdlib/src/lib/bundle';
import {AppService} from '../app.service';
import { IOperationOutcome } from '../../../../../libs/ersdlib/src/lib/operation-outcome';
import S3 from 'aws-sdk/clients/s3';
import path from "path";
import * as fs from 'fs';

@Controller('upload')
export class UploadController {
  private readonly logger = new Logger('UploadController');

  constructor(private httpService: HttpService, private appService: AppService) {
  }

  @Post('excel')
  @UseGuards(AuthGuard())
  async uploadExcel(@Req() request: AuthRequest, @Body() body: IUploadRequest) {
    this.appService.assertAdmin(request);

    this.logger.log('Admin is uploading an RCTC excel');
    const buf = Buffer.from(body.fileContent, 'base64');
    const Bucket = this.appService.serverConfig.payload.Bucket;
    if (typeof Bucket === 'undefined' || Bucket === "") {
      this.logger.log(`Uploading RCTC excel to local storage`);
      const rctcExcelPath = path.resolve(this.appService.serverConfig.rctcExcelPath);
      fs.writeFileSync(rctcExcelPath, buf);
      this.logger.log(`Updated RCTC excel file at path ${rctcExcelPath}.`);
    }
    else {
      this.logger.log(`Uploading RCTC excel to s3`);
      const Metadata = {filename: body.fileName};

      try {
        const s3client = new S3();
        const Key = this.appService.serverConfig.payload.RCTCKey;
        const s3return = await s3client.putObject({
          Bucket,
          Key,
          Metadata,
          Body: buf,
        }).promise()
        this.logger.log(`Uploaded RCTC excel to s3://${Bucket}/${Key}`);
      }
      catch(e) {
        this.logger.error(`Failed to upload RCTC excel to s3 ${JSON.stringify(e)}`);
        throw e;
      }
    }


  }

  @Post('bundle')
  @UseGuards(AuthGuard())
  async uploadBundle(@Req() request: AuthRequest, @Body() body: IUploadRequest) {

    this.appService.assertAdmin(request);

    this.logger.log('Admin is uploading a bundle');

    let resource;
    let xmlData;

    // Parse the JSON or XML
    if (body.fileName.endsWith('.xml')) {
      this.logger.log('Upload is an XML file. Converting to JSON');

      const fhir = new Fhir();
      xmlData = body.fileContent;
      resource = fhir.xmlToObj(body.fileContent);
    } else if (body.fileName.endsWith('.json')) {
      this.logger.log('Upload is already JSON');

      resource = JSON.parse(body.fileContent);
      const fhir = new Fhir();
      xmlData = fhir.objToXml(resource);
    }

    try {
      const Bucket = this.appService.serverConfig.payload.Bucket;
      if (typeof Bucket === 'undefined' || Bucket === "") {
        this.logger.log(`Uploading bundle to local storage`);
        const bundlePath = path.resolve(this.appService.serverConfig.bundlePath);
        fs.writeFileSync(bundlePath, xmlData);
        this.logger.log(`Updated bundle file at path ${bundlePath}.`);
      }
      else {
        const s3client = new S3();
        const Key = this.appService.serverConfig.payload.Key;
        const Metadata = {filename: body.fileName};

        const s3return = await s3client.putObject({
          Bucket,
          Key,
          Metadata,
          Body: xmlData,
        }).promise()
        this.logger.log(`Uploaded bundle to s3://${Bucket}/${Key}`);
      }
    }
    catch(e) {
      this.logger.error(`Failed to upload bundle ${JSON.stringify(e)}`);
      throw e;
    }

    // Attach the message to the bundle being uploaded
    if (body.message && resource.resourceType === 'Bundle') {
      const bundle = <IBundle> resource;

      this.logger.log('Creating an extension on the first entry in the bundle being upload that includes the message from the admin');

      if (bundle.entry && bundle.entry.length > 0 && bundle.entry[0].resource) {
        const firstResource = bundle.entry[0].resource;

        firstResource.extension = firstResource.extension || [];
        firstResource.extension.push({
          url: Constants.extensions.notificationMessage,
          valueString: body.message
        });
      }
    }

    this.logger.log('Posting the transaction to the FHIR server');

    try {
      const requestUrl = this.appService.buildFhirUrl(resource.resourceType, resource.id);
      let response;

      if (resource.id) {
        response = await this.httpService.put(requestUrl, resource).toPromise();
      } else {
        response = await this.httpService.post(requestUrl, resource).toPromise();
      }

      this.logger.log('Done uploading to FHIR server');
    } catch (ex) {
      this.logger.error(`Error occurred while posting the transaction to the FHIR server: ${ex.status} - ${ex.message}`);

      if (ex.response && ex.response.data) {
        this.logger.error(ex.response.data);
      }

      throw ex;
    }
  }
}
