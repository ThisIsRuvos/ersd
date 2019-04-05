export interface EmailSubscriptionInfo {
  emailAddress: string;
  includeArtifacts: boolean;
  format?: 'xml'|'json';
}

export interface RestSubscriptionInfo {
  endpoint?: string;
}

export interface SmsSubscriptionInfo {
  carrier?: 'verizon'|'at&t'|'sprint'|'tmobile';
  mobilePhone?: string;
}

export class UserSubscriptions {
  emailSubscription?: EmailSubscriptionInfo;
  restSubscription?: RestSubscriptionInfo;
  smsSubscription?: SmsSubscriptionInfo;
}
