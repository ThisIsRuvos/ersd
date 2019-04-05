import { IDomainResource } from './domain-resource';
import { IContactPoint } from './contact-point';
import { environment } from '../../../../apps/server/src/environments/environment';

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
  resourceType = 'Subscription';
  id?: string;
  status: 'requested'|'active'|'error'|'off' = 'off';
  contact?: IContactPoint[];
  end?: string;
  reason = 'Automatically created by KDS';
  criteria = environment.subscriptionCriteria;
  error?: string;
  channel: ISubscriptionChannel = {
    type: 'email'
  };

  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
    }
  }

  get isSms(): boolean {
    if (!this.channel || this.channel.type !== 'email') {
      return false;
    }

    return !!this.smsCarrier;
  }

  get smsCarrier(): 'tmobile'|'verizon'|'at&t'|'sprint' {
    if (!this.channel || !this.channel.endpoint) {
      return;
    }

    if (this.channel.endpoint.endsWith('@tomomail.net')) {
      return 'tmobile';
    } else if (this.channel.endpoint.endsWith('@vtext.net')) {
      return 'verizon';
    } else if (this.channel.endpoint.endsWith('@text.att.net')) {
      return 'at&t';
    } else if (this.channel.endpoint.endsWith('@messaging.sprintpcs.com')) {
      return 'sprint';
    }
  }

  get smsPhone(): string {
    if (!this.channel || !this.channel.endpoint) {
      return;
    }

    const starting = this.channel.endpoint.startsWith('mailto:') ? 'mailto:'.length : 0;
    const ending = this.channel.endpoint.indexOf('@');
    return this.channel.endpoint.substring(starting, ending);
  }
}
