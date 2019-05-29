

export function joinUrl(part1: string, part2: string) {
  return part1 +
    (!part1.endsWith('/') ? '/' : '') +
    (part2.startsWith('/') ? part2.substring(1) : part2);
}

export function buildFhirUrl(fhirServerBase: string, resourceType?: string, id?: string, params?: { [key: string]: any }, operation?: string): string {
  let url = resourceType ? joinUrl(fhirServerBase, resourceType) : fhirServerBase;

  if (id) {
    url = joinUrl(url, id);
  }

  if (operation) {
    url = joinUrl(url, operation);
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
