export class UserSubscriptions {
  emailSubscription?: {
    emailAddress: string;
    includeArtifacts: boolean;
    format?: 'xml'|'json';
  }

  restSubscription?: {
    endpoint?: string;
  }

  smsSubscription?: {
    carrier?: 'verizon'|'at&t'|'sprint'|'tmobile';
    mobilePhone?: string;
  }

  get hasRest(): boolean {
    return !!this.restSubscription;
  }

  set hasRest(value: boolean) {
    if (this.restSubscription && !value) {
      delete this.restSubscription;
    } else if (!this.restSubscription && value) {
      this.restSubscription = {};
    }
  }

  get hasSms(): boolean {
    return !!this.smsSubscription;
  }

  set hasSms(value: boolean) {
    if (this.smsSubscription && !value) {
      delete this.smsSubscription;
    } else if (!this.smsSubscription && value) {
      this.smsSubscription = { };
    }
  }
}
