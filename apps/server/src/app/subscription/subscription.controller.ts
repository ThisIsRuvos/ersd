import { Body, Controller, Get, HttpService, Post, Req, UseGuards } from '@nestjs/common';
import {
  EmailSubscriptionInfo,
  RestSubscriptionInfo,
  SmsSubscriptionInfo,
  UserSubscriptions
} from '../../../../../libs/ersdlib/src/lib/user-subscriptions';
import { UserController } from '../user/user.controller';
import { AuthGuard } from '@nestjs/passport';
import { AuthRequest } from '../auth-module/auth-request';
import { ISubscription, Subscription } from '../../../../../libs/ersdlib/src/lib/subscription';
import { Constants } from '../../../../../libs/ersdlib/src/lib/constants';
import { IPerson, Person } from '../../../../../libs/ersdlib/src/lib/person';
import { AxiosResponse } from 'axios';
import { IOperationOutcome } from '../../../../../libs/ersdlib/src/lib/operation-outcome';
import { AppService } from '../app.service';

@Controller('subscription')
export class SubscriptionController {
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
      const restSubscription = subscriptions.find((subscription) => subscription.channel.type === 'rest-hook');
      const smsSubscription = subscriptions.find((subscription) => subscription.isSms);

      return this.buildUserSubscriptions(emailSubscription, restSubscription, smsSubscription);
    }
  }

  private buildUserSubscriptions(emailSubscription: Subscription, restSubscription: Subscription, smsSubscription: Subscription): UserSubscriptions {
    const userSubscriptions = new UserSubscriptions();

    // email
    if (emailSubscription && emailSubscription.channel && emailSubscription.channel.endpoint) {
      const paylodvalues = emailSubscription.channel.payload.split(";")

      userSubscriptions.emailSubscription = {
        emailAddress: emailSubscription.channel.endpoint.startsWith('mailto:') ?
          emailSubscription.channel.endpoint.substring('mailto:'.length) :
          emailSubscription.channel.endpoint,
        includeArtifacts: paylodvalues[0].length !== 0
      };

      if (paylodvalues[0].length !== 0) {
        if (emailSubscription.channel.payload.startsWith('application/json')) {
          userSubscriptions.emailSubscription.format = 'json';
        } else if (emailSubscription.channel.payload.startsWith('application/xml')) {
          userSubscriptions.emailSubscription.format = 'xml';
        }
      }
    }

    // rest
    if (restSubscription && restSubscription.channel && restSubscription.channel.endpoint) {
      const authorizationHeader = (restSubscription.channel.header || []).find(h => h.startsWith(Constants.authPrefix));

      userSubscriptions.restSubscription = {
        endpoint: restSubscription.channel.endpoint
      };

      if (authorizationHeader) {
        userSubscriptions.restSubscription.authorization =
          authorizationHeader.substring(Constants.authPrefix.length);
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

      if (updated.includeArtifacts) {
        switch (updated.format) {
          case 'json':
            current.channel.payload = 'application/json;bodytext=' + Buffer.from(Constants.defaultEmailBody).toString('base64');
            break;
          case 'xml':
            current.channel.payload = 'application/xml;bodytext=' + Buffer.from(Constants.defaultEmailBody).toString('base64');
            break;
          default:
            throw new Error('Unexpected format specified for email subscription');
        }
      } else {
        current.channel.payload = ';bodytext=' + Buffer.from(" ").toString('base64');
      }

      return this.httpService.request({
        method: method,
        url: this.appService.buildFhirUrl('Subscription', current ? current.id : null),
        data: current
      }).toPromise();
    }

    return Promise.resolve();
  }

  private updateRestSubscription(current: Subscription, updated: RestSubscriptionInfo): Promise<any> {
    const method = current ? 'PUT' : 'POST';

    if (current && !updated) {
      const deleteUrl = this.appService.buildFhirUrl('Subscription', current.id);
      return this.httpService.delete(deleteUrl).toPromise();
    } else if (updated) {
      if (!current) {
        current = new Subscription();
        current.channel.type = 'rest-hook';
        current.criteria = this.appService.serverConfig.subscriptionCriteria;
      }

      this.enableSubscription(current);

      current.channel.endpoint = updated.endpoint;

      if (updated.authorization) {
        current.channel.header = current.channel.header || [];
        let authorizationHeader = (current.channel.header || []).find(h => h.startsWith(Constants.authPrefix));

        if (!authorizationHeader) {
          authorizationHeader = Constants.authPrefix + updated.authorization;
          current.channel.header.push(authorizationHeader);
        } else if (authorizationHeader) {
          const index = current.channel.header.indexOf(authorizationHeader);
          current.channel.header[index] = Constants.authPrefix + updated.authorization;
        }
      }

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
      const restSubscription = currentSubscriptions.find((subscription) => subscription.channel.type === 'rest-hook');
      const smsSubscription = currentSubscriptions.find((subscription) => subscription.isSms);

      const updatePromises = [
        this.updateEmailSubscription(emailSubscription, userSubscriptions.emailSubscription),
        this.updateRestSubscription(restSubscription, userSubscriptions.restSubscription),
        this.updateSmsSubscription(smsSubscription, userSubscriptions.smsSubscription)
      ];

      let updatedEmailSubscription: AxiosResponse<Subscription>;
      let updatedRestSubscription: AxiosResponse<Subscription>;
      let updatedSmsSubscription: AxiosResponse<Subscription>;

      return new Promise((resolve, reject) => {
        Promise.all(updatePromises)
          .then((updatedSubscriptions) => {
            updatedEmailSubscription = updatedSubscriptions[0];
            updatedRestSubscription = updatedSubscriptions[1];
            updatedSmsSubscription = updatedSubscriptions[2];

            const updatedPerson =
              this.ensureSubscription(person, emailSubscription, updatedEmailSubscription ? updatedEmailSubscription.data : undefined) ||
              this.ensureSubscription(person, restSubscription, updatedRestSubscription ? updatedRestSubscription.data : undefined) ||
              this.ensureSubscription(person, smsSubscription, updatedSmsSubscription ? updatedSmsSubscription.data : undefined);

            if (updatedPerson) {
              const updatePersonUrl = this.appService.buildFhirUrl('Person', person.id);
              return this.httpService.put(updatePersonUrl, person).toPromise();
            }
          })
          .then(() => {
            const updatedUserSubscriptions = this.buildUserSubscriptions(
              updatedEmailSubscription ? updatedEmailSubscription.data : undefined,
              updatedRestSubscription ? updatedRestSubscription.data : undefined,
              updatedSmsSubscription ? updatedSmsSubscription.data : undefined);
            resolve(updatedUserSubscriptions);
          })
          .catch((err) => reject(err));
      });
    }
  }
}
