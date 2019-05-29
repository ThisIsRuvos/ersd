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
  address?: IAddress;
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
  public address?: IAddress;
  public managingOrganization?: IResourceReference;
  public link?: [{
    target?: IResourceReference;
    assurance?: 'level1'|'level2'|'level3'|'level4';
  }];

  constructor(obj?) {
    if (obj) {
      Object.assign(this, obj);
    }
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

  public get organization(): IOrganization {
    if (this.managingOrganization && this.managingOrganization.reference && this.managingOrganization.reference.startsWith('#') && this.contained) {
      const foundOrganization = <IOrganization> this.contained.find((contained) => contained.id === this.managingOrganization.reference.substring(1));

      if (foundOrganization) {
        return foundOrganization;
      }
    }
  }

  public get organizationName(): string {
    if (this.organization) {
      return this.organization.name;
    }
  }

  public set organizationName(value: string) {
    this.contained = this.contained || [];

    if (this.organization) {
      this.organization.name = value;
    } else {
      const newOrganization = new Organization();
      newOrganization.id = Math.random().toString(36).substring(2, 9);
      newOrganization.name = value;
      this.contained.push(newOrganization);

      this.managingOrganization = {
        reference: '#' + newOrganization.id
      };
    }
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
