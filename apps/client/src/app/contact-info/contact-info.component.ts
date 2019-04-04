import { Component, OnInit } from '@angular/core';
import { IPerson, Person } from '../../../../../libs/kdslib/src/lib/person';
import { HttpClient } from '@angular/common/http';
import { getErrorString } from '../../../../../libs/kdslib/src/lib/get-error-string';

@Component({
  selector: 'kds-contact-info',
  templateUrl: './contact-info.component.html',
  styleUrls: ['./contact-info.component.css']
})
export class ContactInfoComponent implements OnInit {
  public person: Person;
  public message: string;
  public messageIsError: boolean;

  constructor(private httpClient: HttpClient) { }

  public save() {
    this.httpClient.post<Person>('/api/user/me', this.person).toPromise()
      .then((person) => {
        this.person = new Person(person);
        this.message = 'Saved contact information!';
        this.messageIsError = false;
      })
      .catch((err) => {
        this.message = getErrorString(err);
        this.messageIsError = true;
      });
  }

  ngOnInit() {
    this.httpClient.get<IPerson>('/api/user/me').toPromise()
      .then((person: IPerson) => this.person = new Person(person))
      .catch((err) => this.message = getErrorString(err));
  }
}
