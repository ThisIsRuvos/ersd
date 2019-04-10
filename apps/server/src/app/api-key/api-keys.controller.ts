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
import { ICoding } from '../../../../../libs/kdslib/src/lib/coding';

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
    const meta = person.meta || {};
    const tags = meta.tag || [];
    const foundInboundTag = tags.find((extension) => extension.system === Constants.tags.inboundApiKey);
    const foundOutboundTag = tags.find((extension) => extension.system === Constants.tags.outboundApiKey);

    if (foundInboundTag) {
      response.inbound = foundInboundTag.code;
    }

    if (foundOutboundTag) {
      response.outbound = foundOutboundTag.code;
    }

    return response;
  }
  
  private addOrRemoveTag(personId: string, tag: ICoding, operation: '$meta-add'|'$meta-delete') {
    const url = this.buildFhirUrl('Person', personId, null, operation);
    const body = {
      resourceType: 'Parameters',
      parameter: [{
        name: 'meta',
        valueMeta: {
          tag: [tag]
        }
      }]
    };
    return this.httpService.post(url, body).toPromise();
  }

  @Post()
  @UseGuards(AuthGuard())
  async updateApiKeys(@Req() request: AuthRequest, @Body() apiKeys: IUserApiKeys) {
    const userController = new UserController(this.httpService);
    const person = await userController.getMyPerson(request);

    person.meta = person.meta || {};
    person.meta.tag = person.meta.tag || [];

    let foundInboundTag = person.meta.tag.find((extension) => extension.system === Constants.tags.inboundApiKey);
    let foundOutboundTag = person.meta.tag.find((extension) => extension.system === Constants.tags.outboundApiKey);

    if (foundInboundTag && !apiKeys.inbound) {
      await this.addOrRemoveTag(person.id, foundInboundTag, '$meta-delete');
    }

    if (foundOutboundTag && !apiKeys.outbound) {
      await this.addOrRemoveTag(person.id, foundOutboundTag, '$meta-delete');
    }

    if (apiKeys.inbound) {
      if (!foundInboundTag) {
        foundInboundTag = {
          system: Constants.tags.inboundApiKey,
          code: apiKeys.inbound
        };
        await this.addOrRemoveTag(person.id, foundInboundTag, '$meta-add');
      } else if (foundInboundTag.code !== apiKeys.inbound) {
        await this.addOrRemoveTag(person.id, foundInboundTag, '$meta-delete');
        foundInboundTag.code = apiKeys.inbound;
        await this.addOrRemoveTag(person.id, foundInboundTag, '$meta-add');
      }
    }

    if (apiKeys.outbound) {
      if (!foundOutboundTag) {
        foundOutboundTag = {
          system: Constants.tags.outboundApiKey,
          code: apiKeys.outbound
        };
        await this.addOrRemoveTag(person.id, foundOutboundTag, '$meta-add');
      } else if (foundOutboundTag.code !== apiKeys.outbound) {
        await this.addOrRemoveTag(person.id, foundOutboundTag, '$meta-delete');
        foundOutboundTag.code = apiKeys.outbound;
        await this.addOrRemoveTag(person.id, foundOutboundTag, '$meta-add');
      }
    }

    return await this.getApiKeys(request);
  }
}
