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

  public message: string;

  constructor(
    private httpClient: HttpClient,
    public activeModal: NgbActiveModal) {
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
