
export interface IAddress {
  use?: 'home'|'work'|'temp'|'old';
  type?: 'postal'|'physical'|'both';
  text?: string;
  line?: string[];
  city?: string;
  district?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}
