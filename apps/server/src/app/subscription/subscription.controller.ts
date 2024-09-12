import { Body, Controller, Get, InternalServerErrorException, Logger, Post, Req, UseGuards } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import {
  EmailSubscriptionInfo,
  UserSubscriptions
} from '../../../../../libs/ersdlib/src/lib/user-subscriptions';
import { UserController } from '../user/user.controller';
import { AuthGuard } from '@nestjs/passport';
import type { AuthRequest } from '../auth-module/auth-request';
import { ISubscription, Subscription } from '../../../../../libs/ersdlib/src/lib/subscription';
import { Constants } from '../../../../../libs/ersdlib/src/lib/constants';
import { IPerson } from '../../../../../libs/ersdlib/src/lib/person';
import { AxiosResponse } from 'axios';
import { IOperationOutcome } from '../../../../../libs/ersdlib/src/lib/operation-outcome';
import { AppService } from '../app.service';
import { IBundle } from 'libs/ersdlib/src/lib/bundle';

@Controller('subscription')
export class SubscriptionController {
  private readonly logger = new Logger('SubscriptionController');
  constructor(private httpService: HttpService, private appService: AppService) {
  }

  private getSubscription(id: string): Promise<Subscription> {
    const url = this.appService.buildFhirUrl('Subscription', id);

    return new Promise((resolve, reject) => {
      this.httpService.get<ISubscription>(url).toPromise()
        .then((results) => resolve(new Subscription(results.data)))
        .catch((err) => reject(err));
    });
  }

  @Get()
  @UseGuards(AuthGuard())
  async getSubscriptions(@Req() request: AuthRequest): Promise<UserSubscriptions> {
    const userController = new UserController(this.httpService, this.appService);
    const person = await userController.getMyPerson(request);

    if (person && person.extension) {
      const promises = person.extension.filter((extension) => {
        return extension.url === Constants.extensions.subscription &&
          extension.valueReference &&
          extension.valueReference.reference &&
          extension.valueReference.reference.startsWith('Subscription/');
      }).map((extension) => {
        const id = extension.valueReference.reference.substring('Subscription/'.length);
        return this.getSubscription(id);
      });

      const subscriptions = await Promise.all(promises);
      const emailSubscription = subscriptions.find((subscription) => subscription.channel.type === 'email');

      return this.buildUserSubscriptions(emailSubscription);
    }
  }

  private buildUserSubscriptions(emailSubscription: Subscription): UserSubscriptions {
    const userSubscriptions = new UserSubscriptions();

    // email
    if (emailSubscription && emailSubscription.channel && emailSubscription.channel.endpoint) {
      const payloadValues = emailSubscription.channel.payload.split(";")

      userSubscriptions.emailSubscription = {
        emailAddress: emailSubscription.channel.endpoint.startsWith('mailto:') ?
          emailSubscription.channel.endpoint.substring('mailto:'.length) :
          emailSubscription.channel.endpoint,
        includeArtifacts: payloadValues[0].length !== 0
      };

      if (payloadValues[0].length !== 0) {
        if (emailSubscription.channel.payload.startsWith('application/json')) {
          userSubscriptions.emailSubscription.format = 'json';
        } else if (emailSubscription.channel.payload.startsWith('application/xml')) {
          userSubscriptions.emailSubscription.format = 'xml';
        }
      }
    }

    return userSubscriptions;
  }

  private enableSubscription(subscription: Subscription) {
    if (this.appService.serverConfig.enableSubscriptions) {
      subscription.status = 'requested';
    } else {
      subscription.status = 'off';
    }
  }

  private updateEmailSubscription(current: Subscription, updated: EmailSubscriptionInfo): Promise<any> {
    const method = current ? 'PUT' : 'POST';

    if (current && !updated) {
      const deleteUrl = this.appService.buildFhirUrl('Subscription', current.id);
      return this.httpService.delete(deleteUrl).toPromise().catch((err) => {
        this.logger.error(`Error deleting subscription ${current.id}: ${err}`);
      });
    } else if (updated) {
      if (!current) {
        current = new Subscription();
        current.channel.type = 'email';
        current.criteria = this.appService.serverConfig.subscriptionCriteria;
      }

      this.enableSubscription(current);

      current.channel.endpoint = updated.emailAddress.indexOf('mailto:') === 0 ?
        updated.emailAddress :
        'mailto:' + updated.emailAddress;

      current.channel.payload = ';bodytext=' + Buffer.from(Constants.defaultEmailBody).toString('base64');

      return this.httpService.request({
        method: method,
        url: this.appService.buildFhirUrl('Subscription', current ? current.id : null),
        data: current
      }).toPromise().catch((err) => {
        this.logger.error(`Error updating subscription ${current.id}: ${err}`);
      });
    }

    return Promise.resolve();
  }

  private ensureSubscription(person: IPerson, currentSubscription: Subscription, updatedSubscription: Subscription|IOperationOutcome): boolean {
    person.extension = person.extension || [];
    let foundExtension =  currentSubscription ?
      person.extension.find((extension) => extension.url === Constants.extensions.subscription && extension.valueReference && extension.valueReference.reference === `Subscription/${currentSubscription.id}`) :
      undefined;

    if (foundExtension && (!updatedSubscription || updatedSubscription.resourceType === 'OperationOutcome')) {
      const index = person.extension.indexOf(foundExtension);
      person.extension.splice(index, index >= 0 ? 1 : 0);
      return true;
    } else if (!foundExtension && updatedSubscription) {
      foundExtension = {
        url: Constants.extensions.subscription,
        valueReference: {
          reference: `Subscription/${updatedSubscription.id}`
        }
      };
      person.extension.push(foundExtension);
      return true;
    }

    return false;
  }

  @Post()
  @UseGuards(AuthGuard())
  async updateSubscriptions(@Req() request: AuthRequest, @Body() userSubscriptions: UserSubscriptions): Promise<UserSubscriptions> {
    const userController = new UserController(this.httpService, this.appService);
    const person = await userController.getMyPerson(request);

    if (person && person.extension) {
      const promises = person.extension.filter((extension) => {
        return extension.url === Constants.extensions.subscription &&
          extension.valueReference &&
          extension.valueReference.reference &&
          extension.valueReference.reference.startsWith('Subscription/');
      }).map((extension) => {
        const id = extension.valueReference.reference.substring('Subscription/'.length);
        return this.getSubscription(id);
      });

      const currentSubscriptions = await Promise.all(promises);
      const emailSubscription = currentSubscriptions.find((subscription) => subscription.channel.type === 'email');

      const updatePromises = [
        this.updateEmailSubscription(emailSubscription, userSubscriptions.emailSubscription),
      ];

      let updatedEmailSubscription: AxiosResponse<Subscription>;

      return new Promise((resolve, reject) => {
        Promise.all(updatePromises)
          .then((updatedSubscriptions) => {
            updatedEmailSubscription = updatedSubscriptions[0];

            const updatedPerson =
              this.ensureSubscription(person, emailSubscription, updatedEmailSubscription ? updatedEmailSubscription.data : undefined)

            if (updatedPerson) {
              const updatePersonUrl = this.appService.buildFhirUrl('Person', person.id);
              return this.httpService.put(updatePersonUrl, person).toPromise();
            }
          })
          .then(() => {
            const updatedUserSubscriptions = this.buildUserSubscriptions(
              updatedEmailSubscription ? updatedEmailSubscription.data : undefined)
            resolve(updatedUserSubscriptions);
          })
          .catch((err) => reject(err));
      });
    }
  }


  private removeAttachmentsFromBody(subscription): string {

    const updatedSubscription: Subscription = subscription;
    const payloadString = updatedSubscription.channel.payload;

      const payloadBody = payloadString.split(';bodytext=').pop();
      return `;bodytext=${payloadBody}`;
  }

  private createPatchBundle(bundle) {
    const patchBundle = {
      resourceType: 'Bundle',
      type: 'transaction',
      entry: []
    }

    patchBundle.entry = bundle.entry.flatMap(({ resource }) => {
      const newBody = this.removeAttachmentsFromBody(resource);

      if (newBody === 'SMS') { return [] } // no-op if its a sms subscription
      return {
        request: {
          method: 'PUT',
          url: `Subscription/${resource.id}`
        },
        resource: {
          ...resource,
          channel: {
            ...resource.channel,
            payload: newBody
          }
        }
      }
    })
    return patchBundle;
  }

  private async sendUpdateBundle(bundle: IBundle) {
    await this.httpService.request({
      method: 'POST',
      url: this.appService.serverConfig.fhirServerBase,
      data: this.createPatchBundle(bundle)
    }).toPromise();

    const nextLink = bundle.link.find(link => link.relation === 'next')
    if (nextLink && nextLink.url) {
      const nextLinkQueryString = nextLink.url.split('fhir').pop()
      const nextURL = this.appService.serverConfig.fhirServerBase + nextLinkQueryString
      const subscriptionsBundle = await this.httpService.get(nextURL).toPromise()
      const { data: bundle } = subscriptionsBundle;
      this.sendUpdateBundle(bundle)
    }
  }

  @Get('remove_artifacts')
  @UseGuards(AuthGuard())
  async removeAttachmentsFromSubscriptions() {
    const subscriptionsBundle = await this.httpService.get(`${this.appService.serverConfig.fhirServerBase}/Subscription?type=email`).toPromise().catch((err) => {
      this.logger.error(`Error fetching Subscriptions from FHIR server: ${err}`)
      throw new InternalServerErrorException('Error fetching Subscriptions from FHIR server: ' + err)
    });
    const { data: bundle } = subscriptionsBundle;
    this.logger.log('Removing attachments from Subscription resources')
    await this.sendUpdateBundle(bundle);
    return { message: 'Attachments Successfully Removed from Emails' }
  }
}
