import { IDomainResource } from './domain-resource';
import { IIdentifier } from './identifier';
import { IExtension } from './extension';

export interface IBundleEntry {
  extension?: IExtension[];
  fullUrl?: string;
  resource?: IDomainResource;
  request?: {
    method: 'GET'|'POST'|'PUT'|'DELETE';
    url: string;
  };
}

export interface IBundle extends IDomainResource {
  resourceType: 'Bundle';
  identifier?: IIdentifier;
  type: 'document'|'message'|'transaction'|'transaction-response'|'batch'|'batch-response'|'history'|'searchset'|'collection';
  total?: number;
  link?: [{
    relation: 'next'|'previous'|'last'|'first';
    url: string;
  }];
  entry?: IBundleEntry[];
}
