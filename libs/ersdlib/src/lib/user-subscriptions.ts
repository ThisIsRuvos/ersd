export interface EmailSubscriptionInfo {
  emailAddress: string;
  includeArtifacts: boolean;
  format?: 'xml'|'json';
}

export class UserSubscriptions {
  emailSubscription?: EmailSubscriptionInfo;
  // smsSubscription?: SmsSubscriptionInfo;
}
