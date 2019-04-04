import { IDomainResource } from './domain-resource';

export interface IBundle extends IDomainResource {
  resourceType: 'Bundle';
  total?: number;
  entry?: [{
    fullUrl?: string;
    resource?: IDomainResource;
  }]
}
