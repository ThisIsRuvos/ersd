import { Body, Controller, Get, HttpException, HttpService, Logger, Post, Req, UseGuards } from '@nestjs/common';
import {
  EmailSubscriptionInfo,
  SmsSubscriptionInfo,
  UserSubscriptions
} from '../../../../../libs/ersdlib/src/lib/user-subscriptions';
import { UserController } from '../user/user.controller';
import { AuthGuard } from '@nestjs/passport';
import { AuthRequest } from '../auth-module/auth-request';
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
      const emailSubscription = subscriptions.find((subscription) => subscription.channel.type === 'email' && !subscription.isSms);
      const smsSubscription = subscriptions.find((subscription) => subscription.isSms);

      return this.buildUserSubscriptions(emailSubscription, smsSubscription);
    }
  }

  private buildUserSubscriptions(emailSubscription: Subscription, smsSubscription: Subscription): UserSubscriptions {
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

    // sms
    if (smsSubscription && smsSubscription.channel && smsSubscription.channel.endpoint) {
      userSubscriptions.smsSubscription = {
        carrier: smsSubscription.smsCarrier,
        mobilePhone: smsSubscription.smsPhone
      };
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
      return this.httpService.delete(deleteUrl).toPromise();
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
      }).toPromise();
    }

    return Promise.resolve();
  }

  private updateSmsSubscription(current: Subscription, updated: SmsSubscriptionInfo): Promise<any> {
    const method = current ? 'PUT' : 'POST';

    if (current && !updated) {
      const deleteUrl = this.appService.buildFhirUrl('Subscription', current.id);
      return this.httpService.delete(deleteUrl).toPromise();
    } else if (updated) {
      if (!current) {
        current = new Subscription();
        current.channel.type = 'email';
        current.criteria = this.appService.serverConfig.subscriptionCriteria;
      }

      this.enableSubscription(current);

      const mobile = updated.mobilePhone.replace(/[^0-9]/g, '');
      let email = `mailto:${mobile}`;

      switch (updated.carrier) {
        case 'tmobile':
          email += Subscription.SMS_TMOBILE;
          break;
        case 'verizon':
          email += Subscription.SMS_VERIZON;
          break;
        case 'at&t':
          email += Subscription.SMS_ATT;
          break;
        case 'sprint':
          email += Subscription.SMS_SPRINT;
          break;
        default:
          throw new Error(`Unexpected carrier ${updated.carrier}`);
      }

      current.channel.endpoint = email;
      current.channel.payload = 'application/json';   // This is required by HAPI to send an email notification

      return this.httpService.request({
        method: method,
        url: this.appService.buildFhirUrl('Subscription', current ? current.id : null),
        data: current
      }).toPromise();
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
      const emailSubscription = currentSubscriptions.find((subscription) => subscription.channel.type === 'email' && !subscription.isSms);
      const smsSubscription = currentSubscriptions.find((subscription) => subscription.isSms);

      const updatePromises = [
        this.updateEmailSubscription(emailSubscription, userSubscriptions.emailSubscription),
        this.updateSmsSubscription(smsSubscription, userSubscriptions.smsSubscription)
      ];

      let updatedEmailSubscription: AxiosResponse<Subscription>;
      let updatedSmsSubscription: AxiosResponse<Subscription>;

      return new Promise((resolve, reject) => {
        Promise.all(updatePromises)
          .then((updatedSubscriptions) => {
            updatedEmailSubscription = updatedSubscriptions[0];
            updatedSmsSubscription = updatedSubscriptions[1];

            const updatedPerson =
              this.ensureSubscription(person, emailSubscription, updatedEmailSubscription ? updatedEmailSubscription.data : undefined) ||
              this.ensureSubscription(person, smsSubscription, updatedSmsSubscription ? updatedSmsSubscription.data : undefined);

            if (updatedPerson) {
              const updatePersonUrl = this.appService.buildFhirUrl('Person', person.id);
              return this.httpService.put(updatePersonUrl, person).toPromise();
            }
          })
          .then(() => {
            const updatedUserSubscriptions = this.buildUserSubscriptions(
              updatedEmailSubscription ? updatedEmailSubscription.data : undefined,
              updatedSmsSubscription ? updatedSmsSubscription.data : undefined);
            resolve(updatedUserSubscriptions);
          })
          .catch((err) => reject(err));
      });
    }
  }


  private removeAttachmentsFromBody(subscription): string {
    // Since the subscriptions for SMS and Email are both tagged as emails, SMS Subscriptions must be a no-op
    const mobileCarriers = [
      Subscription.SMS_TMOBILE,
      Subscription.SMS_VERIZON,
      Subscription.SMS_ATT,
      Subscription.SMS_SPRINT
    ]; 

    const updatedSubscription: Subscription = subscription;
    const subscriptionEndpoint = updatedSubscription.channel.endpoint;
    const payloadString = updatedSubscription.channel.payload;

    // check if an SMS carrier is present in the subscription endpoint
    if (mobileCarriers.some(carrier => subscriptionEndpoint.includes(carrier))) {
      return 'SMS';
    } else {
      const payloadBody = payloadString.split(';bodytext=').pop();
      return `;bodytext=${payloadBody}`;
    }
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
      this.logger.log('Removing attachments from Subscription resources in the next bundle')
      const subscriptionsBundle = await this.httpService.get(nextLink.url).toPromise();
      const { data: bundle } = subscriptionsBundle;
      this.sendUpdateBundle(bundle)
    }
  }

  @Get('remove_artifacts')
  @UseGuards(AuthGuard())
  async removeAttachmentsFromSubscriptions() {
    const subscriptionsBundle = await this.httpService.get(`${this.appService.serverConfig.fhirServerBase}/Subscription?type=email`).toPromise();
    const { data: bundle } = subscriptionsBundle;
    this.logger.log('Removing attachments from Subscription resources')
    await this.sendUpdateBundle(bundle);
    return { message: 'Attachments Successfully Removed from Emails' }
  }
}
