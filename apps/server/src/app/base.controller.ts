import { environment } from '../environments/environment';

export class BaseController {
  private static joinUrl(part1: string, part2: string) {
    return part1 +
      (!part1.endsWith('/') ? '/' : '') +
      (part2.startsWith('/') ? part2.substring(1) : part2);
  }

  protected buildFhirUrl(resourceType: string, id?: string, params?: { [key: string]: string }): string {
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
