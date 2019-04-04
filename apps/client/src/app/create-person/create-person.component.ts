import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Person } from '../../../../../libs/kdslib/src/lib/person';
import { Constants } from '../../../../../libs/kdslib/src/lib/constants';
import { NgModel } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { getErrorString } from '../../../../../libs/kdslib/src/lib/get-error-string';

@Component({
  selector: 'kds-create-person',
  templateUrl: './create-person.component.html',
  styleUrls: ['./create-person.component.css']
})
export class CreatePersonComponent implements OnInit {
  @Input() person = new Person();
  @Input() profile: Keycloak.KeycloakProfile;

  @ViewChild('firstName') firstNameField: NgModel;
  @ViewChild('lastName') lastNameField: NgModel;
  @ViewChild('email') emailField: NgModel;
  @ViewChild('mobile') mobileField: NgModel;
  @ViewChild('office') officeField: NgModel;
  @ViewChild('secondaryEmail') secondaryEmailField: NgModel;
  @ViewChild('secondaryMobile') secondaryMobileField: NgModel;
  @ViewChild('secondaryOffice') secondaryOfficeField: NgModel;

  public message: string;

  constructor(
    private httpClient: HttpClient,
    public activeModal: NgbActiveModal) {
  }

  public get secondary(): Person {
    if (this.person.extension && this.person.contained) {
      const foundExtension = this.person.extension.find((extension) => extension.url === Constants.extensions.secondaryContact);

      if (foundExtension && foundExtension.valueReference && foundExtension.valueReference.reference && foundExtension.valueReference.reference.startsWith('#')) {
        const containedId = foundExtension.valueReference.reference.substring(1);
        const foundContained = this.person.contained.find((contained) => contained.id === containedId);
        return <Person> foundContained;
      }
    }
  }

  public toggleSecondary(value: boolean) {
    if (this.secondary && !value) {
      const secondary = this.secondary;
      const containedIndex = this.person.contained.indexOf(secondary);
      this.person.contained.splice(containedIndex, containedIndex >= 0 ? 1 : 0);

      const foundExtension = this.person.extension.find((extension) => extension.url === Constants.extensions.secondaryContact);
      const extensionIndex = this.person.extension.indexOf(foundExtension);
      this.person.extension.splice(extensionIndex, extensionIndex >= 0 ? 1 : 0);
    } else if (!this.secondary && value) {
      this.person.contained = this.person.contained || [];
      const newPerson = new Person();
      newPerson.id = Math.random().toString(36).substring(2, 9);
      this.person.contained.push(newPerson);
      this.person.extension = this.person.extension || [];
      this.person.extension.push({
        url: Constants.extensions.secondaryContact,
        valueReference: {
          reference: '#' + newPerson.id
        }
      });
    }
  }

  public get isValid(): boolean {
    return this.person.firstName &&
      this.firstNameField.valid &&
      this.lastNameField.valid &&
      this.emailField.valid &&
      this.mobileField.valid &&
      this.officeField.valid &&
      (!this.secondaryEmailField || this.secondaryEmailField.valid) &&
      (!this.secondaryMobileField || this.secondaryMobileField.valid) &&
      (!this.secondaryOfficeField || this.secondaryOfficeField.valid);
  }

  public ok() {
    this.httpClient.post<Person>('/api/user/me', this.person).toPromise()
      .then((person) => {
        this.activeModal.close(person);
      })
      .catch((err) => this.message = getErrorString(err));
  }

  ngOnInit() {
    if (this.profile) {
      this.person.firstName = this.profile.firstName;
      this.person.lastName = this.profile.lastName;
      this.person.email = this.profile.email;
    }
  }
}
