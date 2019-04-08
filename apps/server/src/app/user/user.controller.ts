import { Body, Controller, Delete, Get, HttpService, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { BaseController } from '../base.controller';
import { AuthGuard } from '@nestjs/passport';
import { IPerson, Person } from '../../../../../libs/kdslib/src/lib/person';
import { AuthRequest } from '../auth-module/auth-request';
import { Constants } from '../../../../../libs/kdslib/src/lib/constants';
import { IBundle } from '../../../../../libs/kdslib/src/lib/bundle';
import { Subscription } from '../../../../../libs/kdslib/src/lib/subscription';

@Controller('user')
@UseGuards(AuthGuard())
export class UserController extends BaseController {
  constructor(private httpService: HttpService) {
    super();
  }

  @Get()
  async getAllPeople(@Req() request: AuthRequest): Promise<IPerson[]> {
    this.assertAdmin(request);

    let people: IPerson[] = [];
    const getNext = (url?: string): Promise<void> => {
      if (!url) {
        url = this.buildFhirUrl('Person', null, { _summary: true });
      }

      return new Promise((resolve, reject) => {
        this.httpService.get<IBundle>(url).toPromise()
          .then((results) => {
            const bundle = results.data;

            if (bundle.entry) {
              const resources = bundle.entry.map((entry) => <IPerson> entry.resource);
              people = people.concat(resources);
            }

            if (bundle.link) {
              const foundNext = bundle.link.find((link) => link.relation === 'next');

              if (foundNext) {
                getNext(foundNext.url)
                  .then(() => resolve())
                  .catch((err) => reject(err));
              } else {
                resolve();
              }
            }
          });
      });
    };

    await getNext();    // get all people
    return people;
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
  async updateMyPerson(@Req() request: AuthRequest, @Body() body: IPerson): Promise<IPerson> {
    const updatePerson = new Person(body);
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

  @Get(':id')
  async getUser(@Req() request: AuthRequest, @Param('id') id: string): Promise<IPerson> {
    this.assertAdmin(request);

    const url = this.buildFhirUrl('Person', id);
    const results = await this.httpService.get<IPerson>(url).toPromise();
    return results.data;
  }

  @Put(':id')
  async updateUser(@Req() request: AuthRequest, @Param('id') id: string, @Body() body: IPerson) {
    this.assertAdmin(request);

    const url = this.buildFhirUrl('Person', id);
    await this.httpService.put<IPerson>(url, body).toPromise();
  }

  @Delete(':id')
  async deleteUser(@Req() request: AuthRequest, @Param('id') id: string) {
    this.assertAdmin(request);

    const url = this.buildFhirUrl('Person', id);
    await this.httpService.delete(url).toPromise();
  }
}
