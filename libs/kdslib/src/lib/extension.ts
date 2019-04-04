import { IResourceReference } from './resource-reference';

export interface IExtension {
  url: string;
  valueString?: string;
  valueBoolean?: boolean;
  valueReference?: IResourceReference;
  // Other value[x] options...
}
