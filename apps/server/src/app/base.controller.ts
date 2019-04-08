import { environment } from '../environments/environment';
import { AuthRequest } from './auth-module/auth-request';
import { UnauthorizedException } from '@nestjs/common';

export class BaseController {
  private static joinUrl(part1: string, part2: string) {
    return part1 +
      (!part1.endsWith('/') ? '/' : '') +
      (part2.startsWith('/') ? part2.substring(1) : part2);
  }

  protected assertAdmin(request: AuthRequest) {
    if (!request.user || !request.user.realm_access || !request.user.realm_access.roles || request.user.realm_access.roles.indexOf('admin') < 0) {
      throw new UnauthorizedException('User is not an admin!');
    }
  }

  protected buildFhirUrl(resourceType: string, id?: string, params?: { [key: string]: any }): string {
    let url = BaseController.joinUrl(environment.fhirServerBase, resourceType);

    if (id) {
      url = BaseController.joinUrl(url, id);
    }

    if (params) {
      url += '?';

      const paramKeys = Object.keys(params);
      for (const key of paramKeys) {
        const value = params[key];

        if (!url.endsWith('?')) {
          url += '&';
        }

        url += encodeURIComponent(key) + '=' + encodeURIComponent(value);
      }
    }

    return url;
  }
}
