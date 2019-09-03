import { Body, Controller, Get, HttpService, Post, Req, UseGuards } from '@nestjs/common';
import { UserController } from '../user/user.controller';
import { AuthGuard } from '@nestjs/passport';
import { AuthRequest } from '../auth-module/auth-request';
import { BaseController } from '../base.controller';
import { Constants } from '../../../../../libs/ersdlib/src/lib/constants';
import { Person } from '../../../../../libs/ersdlib/src/lib/person';
import { IUserApiKeys } from '../../../../../libs/ersdlib/src/lib/user-api-keys';
import { ICoding } from '../../../../../libs/ersdlib/src/lib/coding';

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

    if (foundInboundTag) {
      response.inbound = foundInboundTag.code;
    }

    return response;
  }

  private addOrRemoveTag(personId: string, tag: ICoding, operation: '$meta-add' | '$meta-delete') {
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

    if (foundInboundTag && !apiKeys.inbound) {
      await this.addOrRemoveTag(person.id, foundInboundTag, '$meta-delete');
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

    return await this.getApiKeys(request);
  }
}
