import { Body, Controller, HttpService, Logger, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthRequest } from '../auth-module/auth-request';
import { BaseController } from '../base.controller';
import { Constants } from '../../../../../libs/ersdlib/src/lib/constants';
import { IUploadRequest } from '../../../../../libs/ersdlib/src/lib/upload-request';
import { Fhir } from 'fhir/fhir';
import { IBundle } from '../../../../../libs/ersdlib/src/lib/bundle';

@Controller('upload')
export class UploadController extends BaseController {
  private readonly logger = new Logger();

  constructor(private httpService: HttpService) {
    super();
  }

  @Post()
  @UseGuards(AuthGuard())
  async upload(@Req() request: AuthRequest, @Body() body: IUploadRequest) {
    this.assertAdmin(request);

    this.logger.log('Admin is uploading a document');

    let resource;

    // Parse the JSON or XML
    if (body.fileName.endsWith('.xml')) {
      this.logger.log('Upload is an XML file. Converting to JSON');

      const fhir = new Fhir();
      resource = fhir.xmlToObj(body.fileContent);
    } else if (body.fileName.endsWith('.json')) {
      this.logger.log('Upload is already JSON');

      resource = JSON.parse(body.fileContent);
    }

    // Attach the message to the resource being uploaded
    this.logger.log('Creating an extension on the resource being upload that includes the message from the admin');

    resource.extension = resource.extension || [];
    let foundMessage = resource.extension.find((extension) => extension.url === Constants.extensions.notificationMessage);

    if (!foundMessage) {
      foundMessage = {
        url: Constants.extensions.notificationMessage
      };
      resource.extension.push(foundMessage);
    }

    foundMessage.valueString = body.message;

    // Create a transaction bundle to import into the FHIR server
    this.logger.log('Creating a transaction bundle to send to the FHIR server');

    const transaction: IBundle = {
      resourceType: 'Bundle',
      type: 'transaction',
      entry: [{
        resource: resource,
        request: {
          method: resource.id ? 'PUT' : 'POST',
          url: resource.resourceType + (resource.id ? '/' + resource.id : '')
        }
      }]
    };

    const transactionUrl = this.buildFhirUrl();

    this.logger.log('Posting the transaction to the FHIR server');

    try {
      const results = await this.httpService.post<IBundle>(transactionUrl, transaction).toPromise();
      const resultsBundle = <IBundle>results.data;

      if (resultsBundle.resourceType !== 'Bundle' || !resultsBundle.entry || resultsBundle.entry.length !== 1) {
        // noinspection ExceptionCaughtLocallyJS
        throw new Error('Unexpected response from the FHIR server');
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
