import { IExtension } from './extension';
import { ICoding } from './coding';

export interface IDomainResource {
  resourceType: string;
  id?: string;
  meta?: {
    versionId?: string;
    lastUpdated?: string;
    profile?: string[];
    security?: ICoding[];
    tag?: ICoding[];
  }
  text?: {
    status: 'generated'|'extensions'|'additional'|'empty';
    div: string;
  };
  contained?: IDomainResource[];
  extension?: IExtension[];
  modifierExtension?: IExtension[];
}
