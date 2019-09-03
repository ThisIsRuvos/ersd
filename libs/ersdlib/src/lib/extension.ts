import { IResourceReference } from './resource-reference';

export interface IExtension {
  url: string;
  valueDateTime?: string;
  valueString?: string;
  valueBoolean?: boolean;
  valueReference?: IResourceReference;
  valueInteger?: number;
  // Other value[x] options...
}
