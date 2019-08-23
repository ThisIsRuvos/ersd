import { IDomainResource } from './domain-resource';
import { IIdentifier } from './identifier';
import { IHumanName } from './human-name';
import { IContactPoint } from './contact-point';
import { IResourceReference } from './resource-reference';
import { IAddress } from './address';
import { IExtension } from './extension';
import { IOrganization, Organization } from './organization';
import { Constants } from './constants';
import { ICoding } from './coding';

export interface IPerson extends IDomainResource {
  identifier?: IIdentifier[];
  name?: IHumanName[];
  telecom?: IContactPoint[];
  gender?: 'male'|'female'|'other'|'unknown';
  birthDate?: string;
  address?: IAddress[];
  managingOrganization?: IResourceReference;
  link?: [{
    target?: IResourceReference;
    assurance?: 'level1'|'level2'|'level3'|'level4';
  }];
}

export class Person implements IPerson {
  public resourceType = 'Person';
  public meta?: {
    versionId?: string;
    lastUpdated?: string;
    profile?: string[];
    security?: ICoding[];
    tag?: ICoding[];
  };
  public id?: string;
  public identifier?: IIdentifier[];
  public contained?: IDomainResource[];
  public extension?: IExtension[];
  public name?: IHumanName[];
  public telecom?: IContactPoint[];
  public gender?: 'male'|'female'|'other'|'unknown';
  public birthDate?: string;
  public address?: IAddress[];
  public managingOrganization?: IResourceReference;
  public link?: [{
    target?: IResourceReference;
    assurance?: 'level1'|'level2'|'level3'|'level4';
  }];

  constructor(obj?) {
    if (obj) {
      Object.assign(this, obj);
    }

    // Make sure
    this.contained = (this.contained || []).map((contained) => {
      if (contained.resourceType === 'Person') {
        return new Person(contained);
      }

      return contained;
    });
  }

  public get firstName(): string {
    if (this.name && this.name.length > 0 && this.name[0].given && this.name[0].given.length > 0) {
      return this.name[0].given[0];
    }
  }

  public set firstName(value: string) {
    if (!this.name || this.name.length === 0) {
      this.name = [{}];
    }

    if (!this.name[0].given) {
      this.name[0].given = [];
    }

    this.name[0].given[0] = value;
  }

  public get lastName(): string {
    if (this.name && this.name.length > 0) {
      return this.name[0].family;
    }
  }

  public set lastName(value: string) {
    if (!this.name || this.name.length === 0) {
      this.name = [{}];
    }

    this.name[0].family = value;
  }

  public get email(): string {
    if (this.telecom) {
      const foundEmail = this.telecom.find((telecom) => telecom.system === 'email');

      if (foundEmail) {
        if (foundEmail.value.indexOf('mailto:') === 0) {
          return foundEmail.value.substring('mailto:'.length);
        }

        return foundEmail.value;
      }
    }
  }

  public set email(value: string) {
    this.telecom = this.telecom || [];
    let foundEmail = this.telecom.find((telecom) => telecom.system === 'email');

    if (!foundEmail && value) {
      foundEmail = {
        system: 'email',
        value: 'mailto:' + value
      };
      this.telecom.push(foundEmail);
    } else if (foundEmail && value) {
      foundEmail.value = value;
    } else if (foundEmail && !value) {
      const index = this.telecom.indexOf(foundEmail);
      this.telecom.splice(index, 1);
    }
  }

  public get mobile(): string {
    if (this.telecom) {
      const foundMobile = this.telecom.find((telecom) => telecom.system === 'phone' && telecom.use === 'mobile');

      if (foundMobile) {
        return foundMobile.value;
      }
    }
  }

  public set mobile(value: string) {
    this.telecom = this.telecom || [];
    let foundMobile = this.telecom.find((telecom) => telecom.system === 'phone' && telecom.use === 'mobile');

    if (!foundMobile) {
      foundMobile = {
        system: 'phone',
        use: 'mobile'
      };
      this.telecom.push(foundMobile);
    }

    foundMobile.value = value;
  }

  private static getOrganization(mainResource: IDomainResource, person: IPerson, shouldCreate = false): IOrganization {
    if (person.managingOrganization && person.managingOrganization.reference && person.managingOrganization.reference.startsWith('#') && person.contained) {
      const foundOrganization = <IOrganization> mainResource.contained.find((contained) => contained.id === person.managingOrganization.reference.substring(1));

      if (foundOrganization) {
        return foundOrganization;
      }
    }

    if (shouldCreate) {
      mainResource.contained = mainResource.contained || [];

      const newOrganization = new Organization();
      newOrganization.id = Math.random().toString(36).substring(2, 9);
      newOrganization.name = '';
      mainResource.contained.push(newOrganization);

      person.managingOrganization = {
        reference: '#' + newOrganization.id
      };
    }
  }

  static getOrganizationName(mainResource: IDomainResource, person: IPerson): string {
    const organization = Person.getOrganization(mainResource, person);

    if (organization) {
      return organization.name;
    }
  }

  static setOrganizationName(mainResource: IDomainResource, person: IPerson, value: string) {
    const organization = Person.getOrganization(mainResource, person, true);
    organization.name = value;
  }

  public get organizationTitle(): string {
    if (this.extension) {
      const foundExtension = this.extension.find((extension) => extension.url === Constants.extensions.organizationTitle);

      if (foundExtension) {
        return foundExtension.valueString;
      }
    }
  }

  public set organizationTitle(value: string) {
    this.extension = this.extension || [];

    let foundExtension = this.extension.find((extension) => extension.url === Constants.extensions.organizationTitle);;

    if (!foundExtension) {
      foundExtension = {
        url: Constants.extensions.organizationTitle
      };
      this.extension.push(foundExtension);
    }

    foundExtension.valueString = value;
  }

  public get office(): string {
    if (this.telecom) {
      const foundOffice = this.telecom.find((telecom) => telecom.system === 'phone' && telecom.use === 'work');

      if (foundOffice) {
        return foundOffice.value;
      }
    }
  }

  public set office(value: string) {
    this.telecom = this.telecom || [];
    let foundOffice = this.telecom.find((telecom) => telecom.system === 'phone' && telecom.use === 'work');

    if (!foundOffice) {
      foundOffice = {
        system: 'phone',
        use: 'work'
      };
      this.telecom.push(foundOffice);
    }

    foundOffice.value = value;
  }
  
  public get addressLine() {
    if (this.address && this.address.length > 0 && this.address[0].line && this.address[0].line.length > 0) {
      return this.address[0].line[0];
    }
  }
  
  public set addressLine(value: string) {
    this.address = this.address || [];
    
    if (this.address.length === 0) {
      this.address.push({});
    }

    this.address[0].line = this.address[0].line || [];
    
    if (this.address[0].line.length === 0) {
      this.address[0].line.push(value);
    } else {
      this.address[0].line[0] = value;
    }
  }
  
  public get addressCity() {
    if (this.address && this.address.length > 0) {
      return this.address[0].city;
    }
  }
  
  public set addressCity(value: string) {
    this.address = this.address || [];

    if (this.address.length === 0) {
      this.address.push({});
    }
    
    this.address[0].city = value;
  }

  public get addressState() {
    if (this.address && this.address.length > 0) {
      return this.address[0].state;
    }
  }

  public set addressState(value: string) {
    this.address = this.address || [];

    if (this.address.length === 0) {
      this.address.push({});
    }

    this.address[0].state = value;
  }

  public get addressPostalCode() {
    if (this.address && this.address.length > 0) {
      return this.address[0].postalCode;
    }
  }

  public set addressPostalCode(value: string) {
    this.address = this.address || [];

    if (this.address.length === 0) {
      this.address.push({});
    }

    this.address[0].postalCode = value;
  }

  public get lastExpirationSent(): string {
    const foundExt = (this.extension || []).find((ext) => ext.url === Constants.extensions.lastExpirationSent);

    if (foundExt) {
      return foundExt.valueDateTime;
    }

    return '';
  }

  public set lastExpirationSent(value: string) {
    this.extension = this.extension || [];
    let foundExt = this.extension.find((ext) => ext.url === Constants.extensions.lastExpirationSent);

    if (!foundExt) {
      foundExt = {
        url: Constants.extensions.lastExpirationSent
      };
      this.extension.push(foundExt);
    }

    foundExt.valueDateTime = value;
  }

  public get expirationSentCount(): number {
    const foundExt = (this.extension || []).find((ext) => ext.url === Constants.extensions.expirationSentCount);

    if (foundExt) {
      return foundExt.valueInteger;
    }

    return 0;
  }

  public set expirationSentCount(value: number) {
    this.extension = this.extension || [];
    let foundExt = this.extension.find((ext) => ext.url === Constants.extensions.expirationSentCount);

    if (!foundExt) {
      foundExt = {
        url: Constants.extensions.expirationSentCount
      };
      this.extension.push(foundExt);
    }

    foundExt.valueInteger = value;
  }
}
