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
}
