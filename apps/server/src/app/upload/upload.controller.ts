import { Body, Controller, Get, HttpService, Post, Req, UseGuards } from '@nestjs/common';
import { EmailSubscriptionInfo, RestSubscriptionInfo, SmsSubscriptionInfo, UserSubscriptions } from '../../../../../libs/kdslib/src/lib/user-subscriptions';
import { UserController } from '../user/user.controller';
import { AuthGuard } from '@nestjs/passport';
import { AuthRequest } from '../auth-module/auth-request';
import { ISubscription, Subscription } from '../../../../../libs/kdslib/src/lib/subscription';
import { BaseController } from '../base.controller';
import { Constants } from '../../../../../libs/kdslib/src/lib/constants';
import { IPerson, Person } from '../../../../../libs/kdslib/src/lib/person';
import { AxiosResponse } from 'axios';
import { IOperationOutcome } from '../../../../../libs/kdslib/src/lib/operation-outcome';
import { IUserApiKeys } from '../../../../../libs/kdslib/src/lib/user-api-keys';
import { IUploadRequest } from '../../../../../libs/kdslib/src/lib/upload-request';
import { Fhir } from 'fhir/fhir';
import { IBundle } from '../../../../../libs/kdslib/src/lib/bundle';

@Controller('upload')
export class UploadController extends BaseController {
  constructor(private httpService: HttpService) {
    super();
  }

  @Post()
  @UseGuards(AuthGuard())
  async upload(@Req() request: AuthRequest, @Body() body: IUploadRequest) {
    this.assertAdmin(request);

    let resource;

    // Parse the JSON or XML
    if (body.fileName.endsWith('.xml')) {
      const fhir = new Fhir();
      resource = fhir.xmlToObj(body.fileContent);
    } else if (body.fileName.endsWith('.json')) {
      resource = JSON.parse(body.fileContent);
    }

    // Attach the message to the resource being uploaded
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
    const results = await this.httpService.post<IBundle>(transactionUrl, transaction).toPromise();
    const resultsBundle = <IBundle> results.data;

    if (resultsBundle.resourceType !== 'Bundle' || !resultsBundle.entry || resultsBundle.entry.length !== 1) {
      throw new Error('Unexpected response from the FHIR server');
    }
  }
}
