import { IDomainResource } from './domain-resource';
import { IContactPoint } from './contact-point';

export interface ISubscriptionChannel {
  type: 'rest-hook'|'email'|'sms';
  endpoint?: string;
  payload?: string;
  header?: string[];
}

export interface ISubscription extends IDomainResource {
  status: 'requested'|'active'|'error'|'off';
  contact?: IContactPoint[];
  end?: string;
  reason: string;
  criteria: string;
  error?: string;
  channel: ISubscriptionChannel;
}

export class Subscription implements ISubscription {

  static readonly SMS_SPRINT = '@messaging.sprintpcs.com';
  static readonly SMS_ATT = '@text.att.net';
  static readonly SMS_TMOBILE = '@tomomail.net';
  static readonly SMS_VERIZON = '@vtext.com';

  resourceType = 'Subscription';
  id?: string;
  status: 'requested'|'active'|'error'|'off' = 'off';
  contact?: IContactPoint[];
  end?: string;
  reason = 'Automatically created by ERSD';
  criteria: string;
  error?: string;
  channel: ISubscriptionChannel = {
    type: 'email'
  };

  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
    }
  }

  // get isSms(): boolean {
  //   if (!this.channel || this.channel.type !== 'email') {
  //     return false;
  //   }

  //   return !!this.smsCarrier;
  // }

  // get smsCarrier(): 'tmobile'|'verizon'|'at&t'|'sprint' {
  //   if (!this.channel || !this.channel.endpoint) {
  //     return;
  //   }

  //   if (this.channel.endpoint.endsWith(Subscription.SMS_TMOBILE)) {
  //     return 'tmobile';
  //   } else if (this.channel.endpoint.endsWith(Subscription.SMS_VERIZON)) {
  //     return 'verizon';
  //   } else if (this.channel.endpoint.endsWith(Subscription.SMS_ATT)) {
  //     return 'at&t';
  //   } else if (this.channel.endpoint.endsWith(Subscription.SMS_SPRINT)) {
  //     return 'sprint';
  //   }
  // }

  // get smsPhone(): string {
  //   if (!this.channel || !this.channel.endpoint) {
  //     return;
  //   }

  //   const starting = this.channel.endpoint.startsWith('mailto:') ? 'mailto:'.length : 0;
  //   const ending = this.channel.endpoint.indexOf('@');
  //   const mobile = this.channel.endpoint.substring(starting, ending);

  //   if (mobile.length === 10) {
  //     return mobile.substring(0, 3) + '-' + mobile.substring(3, 6) + '-' + mobile.substring(6, 10);
  //   }

  //   return mobile;
  // }
}
