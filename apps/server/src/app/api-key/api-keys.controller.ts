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

@Controller('api-keys')
export class ApiKeysController extends BaseController {
  constructor(private httpService: HttpService) {
    super();
  }

  @Get()
  @UseGuards(AuthGuard())
  async getApiKeys(@Req() request: AuthRequest): Promise<IUserApiKeys> {
    const userController = new UserController(this.httpService);
    const person = await userController.getMyPerson(request);
    const response: IUserApiKeys = {};
    const extensions = person.extension || [];
    const foundInboundExtension = extensions.find((extension) => extension.url === Constants.extensions.inboundApiKey);
    const foundOutboundExtension = extensions.find((extension) => extension.url === Constants.extensions.outboundApiKey);

    if (foundInboundExtension) {
      response.inbound = foundInboundExtension.valueString;
    }

    if (foundOutboundExtension) {
      response.outbound = foundOutboundExtension.valueString;
    }

    return response;
  }

  @Post()
  @UseGuards(AuthGuard())
  async updateApiKeys(@Req() request: AuthRequest, @Body() apiKeys: IUserApiKeys) {
    const userController = new UserController(this.httpService);
    const person = await userController.getMyPerson(request);

    person.extension = person.extension || [];

    let foundInboundExtension = person.extension.find((extension) => extension.url === Constants.extensions.inboundApiKey);
    let foundOutboundExtension = person.extension.find((extension) => extension.url === Constants.extensions.outboundApiKey);

    if (foundInboundExtension && !apiKeys.inbound) {
      const index = person.extension.indexOf(foundInboundExtension);
      person.extension.splice(index, index >= 0 ? 1 : 0);
    }

    if (foundOutboundExtension && !apiKeys.outbound) {
      const index = person.extension.indexOf(foundOutboundExtension);
      person.extension.splice(index, index >= 0 ? 1 : 0);
    }

    if (apiKeys.inbound) {
      if (!foundInboundExtension) {
        foundInboundExtension = {
          url: Constants.extensions.inboundApiKey
        };
        person.extension.push(foundInboundExtension);
      }

      foundInboundExtension.valueString = apiKeys.inbound;
    }

    if (apiKeys.outbound) {
      if (!foundOutboundExtension) {
        foundOutboundExtension = {
          url: Constants.extensions.outboundApiKey
        };
        person.extension.push(foundOutboundExtension);
      }

      foundOutboundExtension.valueString = apiKeys.outbound;
    }

    const updatePersonUrl = this.buildFhirUrl('Person', person.id);
    await this.httpService.put(updatePersonUrl, person).toPromise();

    return await this.getApiKeys(request);
  }
}
