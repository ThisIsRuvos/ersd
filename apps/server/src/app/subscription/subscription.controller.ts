import { Controller, Get, HttpService, Req, UseGuards } from '@nestjs/common';
import { UserSubscriptions } from '../../../../../libs/kdslib/src/lib/user-subscriptions';
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
        .then((subscription) => resolve(new Subscription(subscription)))
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
}
