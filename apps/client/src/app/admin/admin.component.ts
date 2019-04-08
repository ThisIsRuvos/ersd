import { Component, OnInit } from '@angular/core';
import { IPerson, Person } from '../../../../../libs/kdslib/src/lib/person';
import { HttpClient } from '@angular/common/http';
import { getErrorString } from '../../../../../libs/kdslib/src/lib/get-error-string';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AdminEditPersonComponent } from './edit-person/edit-person.component';
import { AuthService } from '../auth.service';

@Component({
  selector: 'kds-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
  public users: Person[] = [];
  public message: string;
  public messageIsError: boolean;

  constructor(private httpClient: HttpClient,
              private modalService: NgbModal,
              private authService: AuthService) { }

  editUser(user: IPerson) {
    const modalRef = this.modalService.open(AdminEditPersonComponent, { size: 'lg' });
    modalRef.componentInstance.id = user.id;

    modalRef.result.then((results) => {

    });
  }

  deleteUser(user: Person) {
    const currentUserPersonId = this.authService.person ? this.authService.person.id : null;

    if (currentUserPersonId === user.id) {
      this.message = 'You cannot delete yourself!';
      this.messageIsError = true;
      window.scrollTo(0, 0);
      return;
    }

    if (!confirm(`Are you sure you want to delete the user with email ${user.email}?`)) {
      return;
    }

    this.httpClient.delete('/api/user/' + user.id);
  }

  ngOnInit() {
    this.httpClient.get<IPerson[]>('/api/user').toPromise()
      .then((users) => this.users = users.map((user) => new Person(user)))
      .catch((err) => {
        this.message = getErrorString(err);
        this.messageIsError = true;
      });
  }
}
