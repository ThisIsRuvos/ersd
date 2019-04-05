import { Body, Controller, Get, HttpService, Post, Req, UseGuards } from '@nestjs/common';
import { EmailSubscriptionInfo, RestSubscriptionInfo, SmsSubscriptionInfo, UserSubscriptions } from '../../../../../libs/kdslib/src/lib/user-subscriptions';
import { UserController } from '../user/user.controller';
import { AuthGuard } from '@nestjs/passport';
import { AuthRequest } from '../auth-module/auth-request';
import { ISubscription, Subscription } from '../../../../../libs/kdslib/src/lib/subscription';
import { BaseController } from '../base.controller';
import { Constants } from '../../../../../libs/kdslib/src/lib/constants';

@Controller('subscription')
export class SubscriptionController extends BaseController {
  constructor(private httpService: HttpService) {
    super();
  }

  private getSubscription(id: string): Promise<Subscription> {
    const url = this.buildFhirUrl('Subscription', id);

    return new Promise((resolve, reject) => {
      this.httpService.get<ISubscription>(url).toPromise()
        .then((results) => resolve(new Subscription(results.data)))
        .catch((err) => reject(err));
    });
  }

  @Get()
  @UseGuards(AuthGuard())
  async getSubscriptions(@Req() request: AuthRequest): Promise<UserSubscriptions> {
    const response = new UserSubscriptions();
    const userController = new UserController(this.httpService);
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
      const restSubscription = subscriptions.find((subscription) => subscription.channel.type === 'rest-hook');
      const smsSubscription = subscriptions.find((subscription) => subscription.isSms);

      if (emailSubscription && emailSubscription.channel && emailSubscription.channel.endpoint) {
        response.emailSubscription = {
          emailAddress: emailSubscription.channel.endpoint.startsWith('mailto:') ?
            emailSubscription.channel.endpoint.substring('mailto:'.length) :
            emailSubscription.channel.endpoint,
          includeArtifacts: !!emailSubscription.channel.payload
        };

        if (emailSubscription.channel.payload === 'application/json') {
          response.emailSubscription.format = 'json';
        } else if (emailSubscription.channel.payload === 'application/xml') {
          response.emailSubscription.format = 'xml';
        }
      }

      if (restSubscription && restSubscription.channel && restSubscription.channel.endpoint) {
        response.restSubscription = {
          endpoint: restSubscription.channel.endpoint
        };
      }

      if (smsSubscription && smsSubscription.channel && smsSubscription.channel.endpoint) {
        response.smsSubscription = {
          carrier: smsSubscription.smsCarrier,
          mobilePhone: smsSubscription.smsPhone
        };
      }
    }

    return response;
  }

  private updateEmailSubscription(current: Subscription, updated: EmailSubscriptionInfo): Promise<any> {
    if (current && !updated) {
      const deleteUrl = this.buildFhirUrl('Subscription', current.id);
      return this.httpService.delete(deleteUrl).toPromise();
    } else if (updated) {
      if (!current) {
        current = new Subscription();
        current.channel.type = 'email';
      }

      current.channel.endpoint = updated.emailAddress;

      if (updated.includeArtifacts) {
        switch (updated.format) {
          case 'json':
            current.channel.payload = 'application/json';
            break;
          case 'xml':
            current.channel.payload = 'application/xml';
            break;
          default:
            throw new Error('Unexpected format specified for email subscription');
        }
      } else {
        delete current.channel.payload;
      }

      return this.httpService.request({
        method: current ? 'PUT' : 'POST',
        url: this.buildFhirUrl('Subscription', current ? current.id : null),
        data: current
      }).toPromise();
    }

    return Promise.resolve();
  }

  private updateRestSubscription(current: Subscription, updated: RestSubscriptionInfo): Promise<any> {
    if (current && !updated) {
      const deleteUrl = this.buildFhirUrl('Subscription', current.id);
      return this.httpService.delete(deleteUrl).toPromise();
    } else if (updated) {
      if (!current) {
        current = new Subscription();
        current.channel.type = 'rest-hook';
      }

      current.channel.endpoint = updated.endpoint;

      return this.httpService.request({
        method: current ? 'PUT' : 'POST',
        url: this.buildFhirUrl('Subscription', current ? current.id : null),
        data: current
      }).toPromise();
    }

    return Promise.resolve();
  }

  private updateSmsSubscription(current: Subscription, updated: SmsSubscriptionInfo): Promise<any> {
    if (current && !updated) {
      const deleteUrl = this.buildFhirUrl('Subscription', current.id);
      return this.httpService.delete(deleteUrl).toPromise();
    } else if (updated) {
      if (!current) {
        current = new Subscription();
        current.channel.type = 'email';
      }

      const mobile = updated.mobilePhone.replace(/-/g, '');
      let email = `mailto:${mobile}@`;

      switch (updated.carrier) {
        case 'tmobile':
          email += 'tomomail.net';
          break;
        case 'verizon':
          email += 'vtext.net';
          break;
        case 'at&t':
          email += 'text.att.net';
          break;
        case 'sprint':
          email += 'messaging.sprintpcs.com';
          break;
        default:
          throw new Error(`Unexpected carrier ${updated.carrier}`);
      }

      return this.httpService.request({
        method: current ? 'PUT' : 'POST',
        url: this.buildFhirUrl('Subscription', current ? current.id : null),
        data: current
      }).toPromise();
    }

    return Promise.resolve();
  }

  @Post()
  @UseGuards(AuthGuard())
  async updateSubscriptions(@Req() request: AuthRequest, @Body() userSubscriptions: UserSubscriptions): Promise<void> {
    const userController = new UserController(this.httpService);
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
      const restSubscription = currentSubscriptions.find((subscription) => subscription.channel.type === 'rest-hook');
      const smsSubscription = currentSubscriptions.find((subscription) => subscription.isSms);

      const updatePromises = [
        this.updateEmailSubscription(emailSubscription, userSubscriptions.emailSubscription),
        this.updateRestSubscription(restSubscription, userSubscriptions.restSubscription),
        this.updateSmsSubscription(smsSubscription, userSubscriptions.smsSubscription)
      ];

      await Promise.all(updatePromises);
    }
  }
}
