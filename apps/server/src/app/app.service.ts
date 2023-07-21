import * as config from 'config';

import {Injectable, UnauthorizedException} from '@nestjs/common';
import {IServerConfig} from './server-config';
import type { AuthRequest } from './auth-module/auth-request';
import {IEmailConfig} from './email-config';
import {buildFhirUrl} from './helper';
import { IClientConfig } from '../../../../libs/ersdlib/src/lib/client-config';

@Injectable()
export class AppService {
  serverConfig: IServerConfig;
  emailConfig: IEmailConfig;
  clientConfig: IClientConfig;

  constructor() {
    if (config.server) {
      this.serverConfig = <IServerConfig> config.server;
    }

    if (config.email) {
      this.emailConfig = <IEmailConfig> config.email;
    }

    if (config.client) {
      this.clientConfig = <IClientConfig> config.client;
    }
  }

  public assertAdmin(request: AuthRequest) {
    if (!request.user || !request.user.realm_access || !request.user.realm_access.roles || request.user.realm_access.roles.indexOf('admin') < 0) {
      throw new UnauthorizedException('User is not an admin!');
    }
  }

  public buildFhirUrl(resourceType?: string, id?: string, params?: {[key: string]: any }, operation?: string): string {
    return buildFhirUrl(this.serverConfig.fhirServerBase, resourceType, id, params, operation);
  }
}
