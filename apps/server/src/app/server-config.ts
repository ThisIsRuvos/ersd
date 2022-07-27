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
    variables?: {
      [key: string]: string
    },
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
}

export interface IServerConfig {
  port: number;
  authCertificate: string;
  fhirServerBase: string;
  rctcExcelPath: string;
  bundlePath: string;
  subscriptionCriteria: string;
  enableSubscriptions: boolean;
  restrictedResourceTypes: string[];
  contactInfo: IServerConfigContactInfo;
  exampleQuery?: string;
  payload: {
    Bucket: string;
    Key: string;
    RCTCKey: string;
    JSONKey: string;
    ERSDV1_JSON_KEY: string;
    ERSDV1_XML_KEY: string;
    ERSDV2_SUPPLEMENTAL_JSON_KEY: string;
    ERSDV2_SUPPLEMENTAL_XML_KEY: string;
    ERSDV2_SPECIFICATION_JSON_KEY: string;
    ERSDV2_SPECIFICATION_XML_KEY: string;
  };
}
