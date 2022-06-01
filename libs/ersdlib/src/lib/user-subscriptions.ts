export interface EmailSubscriptionInfo {
  emailAddress: string;
  includeArtifacts: boolean;
  format?: 'xml'|'json';
}

export interface SmsSubscriptionInfo {
  carrier?: 'verizon'|'at&t'|'sprint'|'tmobile';
  mobilePhone?: string;
}

export class UserSubscriptions {
  emailSubscription?: EmailSubscriptionInfo;
  smsSubscription?: SmsSubscriptionInfo;
}
