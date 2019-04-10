import { All, BadRequestException, Controller, HttpService, Req, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { BaseController } from '../base.controller';
import { Constants } from '../../../../../libs/kdslib/src/lib/constants';
import { IBundle } from '../../../../../libs/kdslib/src/lib/bundle';
import { Person } from '../../../../../libs/kdslib/src/lib/person';
import * as config from 'config';
import { IServerConfig } from '../server-config';
import { map } from 'rxjs/operators';

const serverConfig = <IServerConfig> config.get('server');

@Controller('fhir')
export class FhirController extends BaseController {
  constructor(private httpService: HttpService) {
    super();
  }

  private assertApiKey(request: Request): Promise<Person> {
    if (!request.header('Authorization')) {
      throw new UnauthorizedException('No authorization header is present');
    }

    let authorization = request.header('authorization');

    if (!authorization.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authorization is not Bearer');
    }

    authorization = authorization.substring('Bearer '.length);

    const tagQuery = `${Constants.tags.inboundApiKey}|${authorization}`;
    const url = this.buildFhirUrl('Person', null, { _tag: tagQuery });

    return this.httpService.get<IBundle>(url).toPromise()
      .then((results) => {
        const bundle = results.data;

        if (bundle.total > 1) {
          throw new UnauthorizedException('Multiple users are associated with the specified API key. Cannot authenticate.');
        }

        if (bundle.total === 0) {
          throw new UnauthorizedException();
        }

        return new Person(bundle.entry[0].resource);
      });
  }

  @All()
  async getData(@Req() request: Request) {
    const person = await this.assertApiKey(request);
    let fhirPart = request.originalUrl.substring('/api/fhir'.length);

    if (fhirPart.startsWith('/')) {
      fhirPart = fhirPart.substring(1);
    }

    if (request.method !== 'GET') {
      throw new BadRequestException(`This FHIR server is a read-only server and only supports GET requests. ${request.method} is not allowed.`);
    }

    if (!fhirPart || fhirPart.startsWith('$')) {
      throw new BadRequestException('Requests against the base/root of the FHIR server are not allowed.');
    }

    let resourceType = fhirPart.indexOf('/') > 0 ? fhirPart.substring(0, fhirPart.indexOf('/')) : fhirPart;

    if (resourceType.indexOf('?') > 0) {
      resourceType = resourceType.substring(0, resourceType.indexOf('?'));
    }

    const restrictedResourceTypes = serverConfig.restrictedResourceTypes ?
      serverConfig.restrictedResourceTypes.map((resourceType) => resourceType.toLowerCase()) :
      [];

    if (restrictedResourceTypes.indexOf(resourceType.toLowerCase()) >= 0) {
      throw new BadRequestException(`Requests for the resource type ${resourceType} are not allowed`);
    }

    const fhirUrl = BaseController.joinUrl(serverConfig.fhirServerBase, fhirPart);

    const headers = request.headers;
    delete headers['authorization'];
    delete headers['cookie'];
    delete headers['host'];

    return this.httpService.get(fhirUrl, { headers: headers }).pipe(
      map(response => response.data)
    );
  }
}
