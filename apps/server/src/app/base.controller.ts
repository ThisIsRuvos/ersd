import { AuthRequest } from './auth-module/auth-request';
import { UnauthorizedException } from '@nestjs/common';
import * as config from 'config';
import { IServerConfig } from './server-config';
import { buildFhirUrl } from './helper';

const serverConfig = <IServerConfig> config.get('server');

export class BaseController {
  protected assertAdmin(request: AuthRequest) {
    if (!request.user || !request.user.realm_access || !request.user.realm_access.roles || request.user.realm_access.roles.indexOf('admin') < 0) {
      throw new UnauthorizedException('User is not an admin!');
    }
  }

  protected buildFhirUrl(resourceType?: string, id?: string, params?: { [key: string]: any }, operation?: string): string {
    return buildFhirUrl(serverConfig.fhirServerBase, resourceType, id, params, operation);
  }
}
