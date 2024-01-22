import { Component, OnInit } from '@angular/core';
import { IPerson, Person } from '../../../../../libs/ersdlib/src/lib/person';
import { HttpClient } from '@angular/common/http';
import { getErrorString } from '../../../../../libs/ersdlib/src/lib/get-error-string';
import { AuthService } from '../auth.service';

@Component({
  templateUrl: './contact-info.component.html',
  styleUrls: ['./contact-info.component.css']
})
export class ContactInfoComponent implements OnInit {
  public person: Person;
  public message: string;
  public messageIsError: boolean;

  constructor(private httpClient: HttpClient, private authService: AuthService) { }

  public save() {
    this.message = null;
    this.messageIsError = false;

    this.httpClient.post<Person>('/api/user/me', this.person).toPromise()
      .then((person) => {
        this.person = new Person(person);
        this.message = 'Saved contact information!';
        this.messageIsError = false;
        this.authService.checkSession();
        window.scrollTo(0, 0);
      })
      .catch((err) => {
        this.message = getErrorString(err);
        this.messageIsError = true;
      });
  }

  public delete() {
    if (!confirm('Are you sure you want to delete your account? You will no longer receive any notifications/communications from ERSD.')) {
      return;
    }

    this.httpClient.delete('/api/user/me').toPromise()
      .then(() => {
        this.authService.logout();
      });
  }

  ngOnInit() {
    this.httpClient.get<IPerson>('/api/user/me').toPromise()
      .then((person: IPerson) => this.person = new Person(person))
      .catch((err) => this.message = getErrorString(err));
  }
}
