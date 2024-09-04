import { Body, Controller, Get, Post, Req, UseGuards,Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { UserController } from '../user/user.controller';
import { AuthGuard } from '@nestjs/passport';
import type { AuthRequest } from '../auth-module/auth-request';
import { Constants } from '../../../../../libs/ersdlib/src/lib/constants';
import type { IUserApiKeys } from '../../../../../libs/ersdlib/src/lib/user-api-keys';
import { ICoding } from '../../../../../libs/ersdlib/src/lib/coding';
import { AppService } from '../app.service';
import * as config from 'config';
import { IServerConfig } from '../server-config';

const serverConfig = <IServerConfig>config.server;

@Controller('api-keys')
export class ApiKeysController {
  private readonly logger = new Logger(UserController.name);

  constructor(private httpService: HttpService, private appService: AppService) {
  }

  @Get()
  @UseGuards(AuthGuard())
  async getApiKeys(@Req() request: AuthRequest): Promise<IUserApiKeys> {
    const userController = new UserController(this.httpService, this.appService);
    const person = await userController.getMyPerson(request);
    const response: IUserApiKeys = {};
    const meta = person.meta || {};
    const tags = meta.tag || [];
    const foundInboundTag = tags.find((extension) => extension.system === Constants.tags.inboundApiKey);

    if (foundInboundTag) {
      response.inbound = foundInboundTag.code;
    }

    if (serverConfig && serverConfig.exampleQuery) {
      response.exampleQuery = serverConfig.exampleQuery;
    }

    return response;
  }

  private async addOrRemoveTag(personId: string, tag: ICoding, operation: '$meta-add' | '$meta-delete') {
    const url = this.appService.buildFhirUrl('Person', personId, null, operation);
    const body = {
      resourceType: 'Parameters',
      parameter: [{
        name: 'meta',
        valueMeta: {
          tag: [tag]
        }
      }]
    };
    try {
      const response = await this.httpService.post(url, body).toPromise();
      return response
    } catch (error) {
      this.logger.error(`Error ${operation} for tag, error: ${error}`);
      return;
    }
  }

  @Post()
  @UseGuards(AuthGuard())
  async updateApiKeys(@Req() request: AuthRequest, @Body() apiKeys: IUserApiKeys) {
    const userController = new UserController(this.httpService, this.appService);
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
