import { Component, Input, OnInit, Output, ViewChild } from '@angular/core';
import { Person } from '../../../../../libs/ersdlib/src/lib/person';
import { NgForm, NgModel } from '@angular/forms';
import { Constants } from '../../../../../libs/ersdlib/src/lib/constants';

@Component({
  selector: 'ersd-edit-person',
  templateUrl: './edit-person.component.html',
  styleUrls: ['./edit-person.component.css']
})
export class EditPersonComponent implements OnInit {
  @Input() person: Person;
  @ViewChild('editPersonForm') editPersonForm: NgForm;
  
  @ViewChild('firstName') firstNameField: NgModel;
  @ViewChild('lastName') lastNameField: NgModel;
  @ViewChild('email') emailField: NgModel;
  @ViewChild('primaryMobile') primaryMobileField: NgModel;
  @ViewChild('office') officeField: NgModel;
  @ViewChild('secondaryEmail') secondaryEmailField: NgModel;
  @ViewChild('secondaryMobile') secondaryMobileField: NgModel;
  @ViewChild('secondaryOffice') secondaryOfficeField: NgModel;

  public Person = Person;

  constructor() { }

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
    return (!this.firstNameField || this.firstNameField.valid) &&
      (!this.lastNameField || this.lastNameField.valid) &&
      (!this.emailField || this.emailField.valid) &&
      (!this.primaryMobileField || this.primaryMobileField.valid) &&
      (!this.officeField || this.officeField.valid) &&
      (!this.secondaryEmailField || this.secondaryEmailField.valid) &&
      (!this.secondaryMobileField || this.secondaryMobileField.valid) &&
      (!this.secondaryOfficeField || this.secondaryOfficeField.valid);
  }

  isFormDirty(): boolean {
    return this.editPersonForm.dirty;
  }


  resetFormDirty() {
    this.editPersonForm.form.markAsPristine();
  }
  
  ngOnInit() {

  }
}
