import { IIdentifier } from './identifier';

export interface IResourceReference {
  reference?: string;
  identifier?: IIdentifier;
  display?: string;
}
