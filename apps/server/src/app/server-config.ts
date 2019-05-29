export interface IServerConfigContactInfo {
  checkDurationSeconds?: number;
  checkCountPerPage: number;
  expiration: {
    value: number;
    unit: 'month'|'months'|'m'|'year'|'years'|'y'|'day'|'days'|'d';
  };
  notificationInterval: {
    value: number;
    unit: 'month'|'months'|'m'|'year'|'years'|'y'|'day'|'days'|'d';
  };
  maxNotifications: number;
  templates: {
    expiring: {
      subject: string;
      html: string;
      text: string;
    };
    expired: {
      subject: string;
      html: string;
      text: string;
    };
  };
};

export interface IServerConfig {
  port: number;
  authCertificate: string;
  fhirServerBase: string;
  subscriptionCriteria: string;
  enableSubscriptions: boolean;
  restrictedResourceTypes: string[];
  contactInfo: IServerConfigContactInfo;
}
