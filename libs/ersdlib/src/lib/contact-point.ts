
export interface IContactPoint {
  system?: 'phone'|'fax'|'email'|'page'|'url'|'sms'|'other';
  value?: string;
  use?: 'home'|'work'|'temp'|'old'|'mobile';
  rank?: number;
}
