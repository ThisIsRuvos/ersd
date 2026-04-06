import { Body, Controller, Logger, Post, Req, Res, Header, UseGuards, InternalServerErrorException, StreamableFile, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Parser, } from '@json2csv/plainjs';
import {
  string as stringFormatter,
} from '@json2csv/formatters';
import { AuthGuard } from '@nestjs/passport';
import type { AuthRequest } from '../auth-module/auth-request';
import { Constants } from '../../../../../libs/ersdlib/src/lib/constants';
import type { IUploadRequest, } from '../../../../../libs/ersdlib/src/lib/upload-request';
import type { IEmailExportRequest } from '../../../../../libs/ersdlib/src/lib/email-request';

import { Fhir } from 'fhir/fhir';
import { IBundle } from '../../../../../libs/ersdlib/src/lib/bundle';
import { AppService } from '../app.service';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import path, { join } from "path";
import { validateEmail } from '../helper';
import { createReadStream, writeFileSync, unlinkSync } from 'fs';
import { lastValueFrom } from 'rxjs';

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
      writeFileSync(rctcExcelPath, buf);
      this.logger.log(`Updated RCTC excel file at path ${rctcExcelPath}.`);
    }
    else {
      this.logger.log(`Uploading RCTC excel to s3`);
      const Metadata = { filename: body.fileName };

      try {
        const s3client = new S3Client({});
        const Key = this.appService.serverConfig.payload.RCTCKey;
        this.logger.log(`Uploaded RCTC excel to s3://${Bucket}/${Key}`);
        await s3client.send(new PutObjectCommand({
          Bucket,
          Key,
          Metadata,
          Body: buf,
        }))
        this.logger.log(`Uploaded RCTC excel to s3://${Bucket}/${Key}`);
      }
      catch (e) {
        this.logger.error(`Failed to upload RCTC excel to s3 ${JSON.stringify(e)}`);
        throw e;
      }
    }
  }

  private extractEmailsFromPage(resources: any[], exportTypeOrigin: string): string[] {
    const emails: string[] = [];
    if (exportTypeOrigin === 'Subscription') {
      for (const i of resources) {
        if (i?.status !== 'active' || i?.channel?.type !== 'email' || i?.channel?.payload === 'application/json') continue;
        const email = i?.channel?.endpoint?.replaceAll('mailto:', '');
        if (validateEmail(email)) {
          emails.push(email.toLowerCase());
        } else {
          this.logger.error(`Invalid email address ${email}`);
        }
      }
    } else if (exportTypeOrigin === 'Person') {
      for (const i of resources) {
        const primaryEmail = i?.telecom?.find(j => j.system === 'email')?.value;
        const secondaryEmail = i?.contained?.find?.(c => c?.resourceType === 'Person')?.telecom?.find(j => j.system === 'email')?.value;
        const allPersonEmails = [primaryEmail, secondaryEmail].map(e => e && e.replaceAll('mailto:', '')).filter(e => e);
        for (const email of allPersonEmails) {
          if (validateEmail(email)) {
            emails.push(email.toLowerCase());
          } else {
            this.logger.error(`Invalid email address ${email}`);
          }
        }
      }
    }
    return emails;
  }

  async getEmails(exportTypeOrigin: string) {
    const emailSet = new Set<string>();

    const fhirParams: Record<string, any> = {
      _count: 500,
    };
    if (exportTypeOrigin === 'Subscription') {
      fhirParams._elements = 'status,channel';
    } else if (exportTypeOrigin === 'Person') {
      fhirParams._elements = 'telecom,contained';
    }

    let url = this.appService.buildFhirUrl(exportTypeOrigin, null, fhirParams);

    while (url) {
      const results = await lastValueFrom(this.httpService.get<IBundle>(url));
      const bundle = results.data;

      if (bundle.entry) {
        const resources = bundle.entry.map((entry) => entry.resource);
        const pageEmails = this.extractEmailsFromPage(resources, exportTypeOrigin);
        for (const email of pageEmails) {
          emailSet.add(email);
        }
      }

      const nextLink = bundle.link?.find((link) => link.relation === 'next');
      if (nextLink) {
        const nextParams = nextLink.url.substring(nextLink.url.indexOf('?'));
        url = this.appService.serverConfig.fhirServerBase + nextParams;
      } else {
        url = null;
      }
    }

    return Array.from(emailSet);
  }

  @Post('get-emails')
  @UseGuards(AuthGuard())
  async getEmaisl(@Body() { exportTypeOrigin }: { exportTypeOrigin: string }) {
    const emails = await this.getEmails(exportTypeOrigin);
    return emails;
  }

  @Post('export')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="emails.csv"')
  @UseGuards(AuthGuard())
  async exportEmails(@Req() request: AuthRequest, @Res({ passthrough: true }) res: Response, @Body() body: IEmailExportRequest) {
    this.appService.assertAdmin(request);
    const exportTypeOrigin = body.exportTypeOrigin;
    if (exportTypeOrigin !== 'Subscription' && exportTypeOrigin !== 'Person' && exportTypeOrigin !== 'Both') throw new BadRequestException('Invalid export type origin');
    this.logger.log('Admin exporting email list from fhir resource:' + exportTypeOrigin);
    this.logger.log('Getting all people registered in the FHIR server');
    let emails: string[];
    if (exportTypeOrigin === 'Both') {
      const [personEmails, subscriptionEmails] = await Promise.all([
        this.getEmails('Person'),
        this.getEmails('Subscription'),
      ]);
      const merged = new Set([...personEmails, ...subscriptionEmails]);
      emails = Array.from(merged);
    } else {
      emails = await this.getEmails(exportTypeOrigin);
    }
    this.logger.log('Found ' + emails.length + ' emails');
    try {
      this.logger.log('Converting emails to CSV');
      const parser = new Parser({
        formatters: {
          string: stringFormatter({ quote: '' }),
        }
      });
      return parser.parse(emails.map(i => ({ email: i })));
    } catch (err) {
      this.logger.error('Error converting emails to CSV', err);
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

    // Attach the message to the bundle being uploaded
    if (body.message && resource.resourceType === 'Bundle') {
      const bundle = <IBundle>resource;

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

    try {
      const Bucket = this.appService.serverConfig.payload.Bucket;
      if (typeof Bucket === 'undefined' || Bucket === "") {
        this.logger.log(`Uploading bundle to local storage`);
        const bundlePath = path.resolve(this.appService.serverConfig.bundlePath);
        writeFileSync(bundlePath, xmlData);
        this.logger.log(`Updated bundle file at path ${bundlePath}.`);
      }
      else {
        const s3client = new S3Client({});
        const Key = this.appService.serverConfig.payload.Key;
        const Metadata = { filename: body.fileName };

        await s3client.send(new PutObjectCommand({
          Bucket,
          Key,
          Metadata,
          Body: xmlData,
        }))
        this.logger.log(`Uploaded bundle to s3://${Bucket}/${Key}`);
      }
    }
    catch (e) {
      this.logger.error(`Failed to upload bundle ${JSON.stringify(e)}`);
      throw e;
    }

    this.logger.log('Posting the transaction to the FHIR server');

    try {
      const requestUrl = this.appService.buildFhirUrl(resource.resourceType, resource.id);
      let response;

      const config = {
        maxContentLength: 2147483648,
        maxBodyLength: 2147483648,

      }
      if (resource.id) {
        response = await this.httpService.put(requestUrl, resource, config).toPromise();
      } else {
        response = await this.httpService.post(requestUrl, resource, config).toPromise();
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
