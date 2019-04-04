import { IDomainResource } from './domain-resource';
import { IIdentifier } from './identifier';
import { ICodeableConcept } from './codeable-concept';
import { IContactPoint } from './contact-point';
import { IAddress } from './address';
import { IResourceReference } from './resource-reference';
import { IHumanName } from './human-name';

export interface IOrganization extends IDomainResource {
  identifier?: IIdentifier[];
  active?: boolean;
  type?: ICodeableConcept[];
  name?: string;
  alias?: string[];
  telecom?: IContactPoint;
  address?: IAddress[];
  partOf?: IResourceReference;
  contact?: [{
    purpose?: ICodeableConcept;
    name?: IHumanName;
    telecom?: IContactPoint[];
    address?: IAddress;
  }];
}

export class Organization implements IOrganization {
  resourceType = 'Organization';
  id?: string;
  identifier?: IIdentifier[];
  active?: boolean;
  type?: ICodeableConcept[];
  name?: string;
  alias?: string[];
  telecom?: IContactPoint;
  address?: IAddress[];
  partOf?: IResourceReference;
  contact?: [{
    purpose?: ICodeableConcept;
    name?: IHumanName;
    telecom?: IContactPoint[];
    address?: IAddress;
  }];
}
