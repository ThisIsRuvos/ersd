import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { IPerson, Person } from '../../../../../../libs/ersdlib/src/lib/person';
import { HttpClient } from '@angular/common/http';
import { getErrorString } from '../../../../../../libs/ersdlib/src/lib/get-error-string';
import { EditPersonComponent } from '../../edit-person/edit-person.component';
import { firstValueFrom } from 'rxjs';

@Component({
  templateUrl: './edit-person.component.html',
  styleUrls: ['./edit-person.component.css'],
  standalone: false
})
export class AdminEditPersonComponent implements OnInit {
  @Output() updatedUser: EventEmitter<any> = new EventEmitter<any>();
  @Output() messageIsSuccess: EventEmitter<any> = new EventEmitter<any>();

  @Input() id: string;
  public person: Person;
  public message: string;
  isError = false;

  @ViewChild('editPerson') editPersonField: EditPersonComponent;
  loading: boolean = false;

  constructor(
    public activeModal: NgbActiveModal,
    private httpClient: HttpClient) { }

  get isValid() {
    return this.editPersonField && this.editPersonField.isValid;
  }
  
  async save() {
    try {

      this.message = null;
      this.isError = false;
      this.loading = true;
      const results = await firstValueFrom(this.httpClient.put<IPerson>('/api/user/' + this.id, this.person));
      this.loading = false;
      this.activeModal.close(results);
      this.updatedUser.emit(results); 
      this.messageIsSuccess.emit(true);
    } catch (err) {
      this.message = getErrorString(err);// <-- TODO - if this is not being used, it could be removed in the future.
      this.messageIsSuccess.emit(false);
    }
  }

  ngOnInit() {
    this.httpClient.get<IPerson>('/api/user/' + this.id).toPromise()
      .then((results) => this.person = new Person(results))
      .catch((err) => {
        this.message = getErrorString(err);
        this.messageIsSuccess.emit(false)
      });
  }
}
