import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Person } from '../../../../../libs/ersdlib/src/lib/person';
import { HttpClient } from '@angular/common/http';
import { getErrorString } from '../../../../../libs/ersdlib/src/lib/get-error-string';
import { KeycloakProfile } from '../auth.service';
import { formatPhone } from '../../../../../libs/ersdlib/src/lib/helper';

@Component({
  templateUrl: './create-person.component.html',
  styleUrls: ['./create-person.component.css']
})
export class CreatePersonComponent implements OnInit {
  @Input() person = new Person();
  @Input() profile: KeycloakProfile;

  public message: string;

  constructor(
    private httpClient: HttpClient,
    public activeModal: NgbActiveModal) {
  }

  ok() {
    this.httpClient.post<Person>('/api/user/me', this.person).toPromise()
      .then((person) => {
        this.activeModal.close(person);
      })
      .catch((err) => this.message = getErrorString(err));
  }

  private getProfileAttributes(...names: string[]) {
    if (names) {
      for (let i = 0; i < names.length; i++) {
        const value = this.getProfileAttribute(names[i]);

        if (value) {
          return value;
        }
      }
    }
  }

  private getProfileAttribute(name: string) {
    if (this.profile && this.profile.attributes && this.profile.attributes && this.profile.attributes[name] && this.profile.attributes[name] instanceof Array && this.profile.attributes[name].length > 0) {
      return this.profile.attributes[name][0];
    }
  }

  ngOnInit() {
    if (this.profile) {
      this.person.firstName = this.profile.firstName;
      this.person.lastName = this.profile.lastName;
      this.person.email = this.profile.email;
      this.person.mobile = formatPhone(this.getProfileAttributes('mobile', 'cell'));
      this.person.office = formatPhone(this.getProfileAttribute('office'));
      this.person.addressLine = this.getProfileAttributes('street', 'address', 'line');
      this.person.addressCity = this.getProfileAttribute('city');
      this.person.addressState = this.getProfileAttributes('state', 'st');
      this.person.addressPostalCode = this.getProfileAttributes('postal', 'postalCode', 'zip');
    }
  }
}
