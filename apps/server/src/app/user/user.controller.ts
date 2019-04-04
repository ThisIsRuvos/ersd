import { Controller, Get, HttpService, Post, Req, UseGuards } from '@nestjs/common';
import { BaseController } from '../base.controller';
import { AuthGuard } from '@nestjs/passport';
import { IPerson } from '../../../../../libs/kdslib/src/lib/person';
import { AuthRequest } from '../auth-module/auth-request';
import { Constants } from '../../../../../libs/kdslib/src/lib/constants';
import { IBundle } from '../../../../../libs/kdslib/src/lib/bundle';

interface UpdateMyPersonRequest extends AuthRequest {
  body: IPerson;
}

@Controller('user')
@UseGuards(AuthGuard())
export class UserController extends BaseController {
  constructor(private httpService: HttpService) {
    super();
  }

  @Get('me')
  async getMyPerson(@Req() request: AuthRequest): Promise<IPerson> {
    const identifierQuery = Constants.keycloakSystem + '|' + request.user.sub;

    return this.httpService.request<IBundle>({
      url: this.buildFhirUrl('Person', null, { identifier: identifierQuery }),
      headers: {
        'cache-control': 'no-cache'
      }
    }).toPromise()
      .then((peopleBundle) => {
        if (peopleBundle.data && peopleBundle.data.total === 1) {
          return <IPerson> peopleBundle.data.entry[0].resource;
        }
      });
  }

  @Post('me')
  async updateMyPerson(@Req() request: UpdateMyPersonRequest): Promise<IPerson> {
    const updatePerson = request.body;
    updatePerson.identifier = updatePerson.identifier || [];

    let foundIdentifier = updatePerson.identifier.find((identifier) => identifier.use === Constants.keycloakSystem);

    if (!foundIdentifier) {
      foundIdentifier = {
        system: Constants.keycloakSystem,
        value: request.user.sub
      };
      updatePerson.identifier.push(foundIdentifier);
    }

    return this.getMyPerson(request)
      .then((person) => {
        return this.httpService.request<IPerson>({
          method: person ? 'PUT' : 'POST',
          url: this.buildFhirUrl('Person', person ? person.id : ''),
          data: request.body
        }).toPromise();
      })
      .then((updateResponse) => {
        return updateResponse.data;
      });
  }
}
