import { Controller, Get, HttpService, Post, Req, UseGuards } from '@nestjs/common';
import { BaseController } from '../base.controller';
import { AuthGuard } from '@nestjs/passport';
import { IPerson, Person } from '../../../../../libs/kdslib/src/lib/person';
import { AuthRequest } from '../auth-module/auth-request';
import { Constants } from '../../../../../libs/kdslib/src/lib/constants';
import { IBundle } from '../../../../../libs/kdslib/src/lib/bundle';
import { Subscription } from '../../../../../libs/kdslib/src/lib/subscription';

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
    const updatePerson = new Person(request.body);
    updatePerson.identifier = updatePerson.identifier || [];

    let foundIdentifier = updatePerson.identifier.find((identifier) => identifier.system === Constants.keycloakSystem);

    if (!foundIdentifier) {
      foundIdentifier = {
        system: Constants.keycloakSystem,
        value: request.user.sub
      };
      updatePerson.identifier.push(foundIdentifier);
    }

    let existingPerson;

    return this.getMyPerson(request)
      .then((person) => {
        existingPerson = person;

        if (!existingPerson) {
          const newSubscriptionUrl = this.buildFhirUrl('Subscription');
          const newSubscription = new Subscription();
          newSubscription.channel.endpoint = updatePerson.email;

          return this.httpService.post<Subscription>(newSubscriptionUrl, newSubscription).toPromise();
        }
      })
      .then((results) => {
        if (results && results.data) {
          const newSubscription = new Subscription(results.data);

          updatePerson.extension = updatePerson.extension || [];
          updatePerson.extension.push({
            url: Constants.extensions.subscription,
            valueReference: {
              reference: 'Subscription/' + newSubscription.id
            }
          });
        }

        return this.httpService.request<IPerson>({
          method: existingPerson ? 'PUT' : 'POST',
          url: this.buildFhirUrl('Person', existingPerson ? existingPerson.id : ''),
          data: updatePerson
        }).toPromise();
      })
      .then((updateResponse) => {
        return updateResponse.data;
      });
  }
}
