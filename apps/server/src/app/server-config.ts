export interface IServerConfigContactInfo {
  enableExpiryCheck: boolean;
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
  serveV3: boolean,
  payload: {
    Bucket: string;
    Key: string;
    RCTCKey: string;
    JSONKey: string;
    ERSDV3_SPECIFICATION_JSON_KEY: string
    ERSDV3_SPECIFICATION_XML_KEY: string
    ERSD_RELEASE_DESCRIPTION_V3_KEY: string
    ERSDV3_CHANGE_PREVIEW_JSON_KEY: string;
    ERSDV3_CHANGE_PREVIEW_XML_KEY: string;
    ERSDV3_CHANGE_PREVIEW_SUMMARY_KEY: string;
    RCTC_CHANGE_LOG_KEY: string;
    RCTC_RELEASE_SPREADSHEET_KEY: string;
  };
}
