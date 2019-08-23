import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { IPerson, Person } from '../../../../../../libs/ersdlib/src/lib/person';
import { HttpClient } from '@angular/common/http';
import { getErrorString } from '../../../../../../libs/ersdlib/src/lib/get-error-string';
import { EditPersonComponent } from '../../edit-person/edit-person.component';

@Component({
  selector: 'kds-admin-edit-person',
  templateUrl: './edit-person.component.html',
  styleUrls: ['./edit-person.component.css']
})
export class AdminEditPersonComponent implements OnInit {
  @Input() id: string;
  public person: Person;
  public message: string;
  public messageIsError: boolean;

  @ViewChild('editPerson') editPersonField: EditPersonComponent;

  constructor(
    public activeModal: NgbActiveModal,
    private httpClient: HttpClient) { }

  get isValid() {
    return this.editPersonField && this.editPersonField.isValid;
  }

  save() {
    this.message = null;
    this.messageIsError = false;

    this.httpClient.put<IPerson>('/api/user/' + this.id, this.person).toPromise()
      .then((results) => {
        this.activeModal.close(results);
      })
      .catch((err) => {
        this.message = getErrorString(err);
        this.messageIsError = true;
      });
  }

  ngOnInit() {
    this.httpClient.get<IPerson>('/api/user/' + this.id).toPromise()
      .then((results) => this.person = new Person(results))
      .catch((err) => {
        this.message = getErrorString(err);
        this.messageIsError = true;
      });
  }
}
