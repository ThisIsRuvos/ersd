import {Body, Controller, HttpService, Logger, Post, Req, UseGuards} from '@nestjs/common';
import {AuthGuard} from '@nestjs/passport';
import {AuthRequest} from '../auth-module/auth-request';
import {Constants} from '../../../../../libs/ersdlib/src/lib/constants';
import {IUploadRequest} from '../../../../../libs/ersdlib/src/lib/upload-request';
import {Fhir} from 'fhir/fhir';
import {IBundle} from '../../../../../libs/ersdlib/src/lib/bundle';
import {AppService} from '../app.service';
import { IOperationOutcome } from '../../../../../libs/ersdlib/src/lib/operation-outcome';

@Controller('upload')
export class UploadController {
  private readonly logger = new Logger();

  constructor(private httpService: HttpService, private appService: AppService) {
  }

  @Post()
  @UseGuards(AuthGuard())
  async upload(@Req() request: AuthRequest, @Body() body: IUploadRequest) {
    this.appService.assertAdmin(request);

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

    // Attach the message to the bundle being uploaded
    if (body.message && resource.resourceType === 'Bundle') {
      const bundle = <IBundle> resource;

      this.logger.log('Creating an extension on the first entry in the bundle being upload that includes the message from the admin');

      if (bundle.entry && bundle.entry.length > 0) {
        const firstEntry = bundle.entry[0];

        firstEntry.extension = firstEntry.extension || [];
        firstEntry.extension.push({
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
