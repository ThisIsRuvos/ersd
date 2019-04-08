import { IDomainResource } from './domain-resource';

export interface IBundle extends IDomainResource {
  resourceType: 'Bundle';
  total?: number;
  link?: [{
    relation: 'next'|'previous'|'last'|'first';
    url: string;
  }];
  entry?: [{
    fullUrl?: string;
    resource?: IDomainResource;
  }];
}
