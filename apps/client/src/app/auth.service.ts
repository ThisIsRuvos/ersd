import { Injectable } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { Keycloak } from 'keycloak-angular/lib/core/services/keycloak.service';
import { IPerson } from '../../../../libs/kdslib/src/lib/person';
import { HttpClient } from '@angular/common/http';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CreatePersonComponent } from './create-person/create-person.component';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public loggedIn: boolean;
  public profile: Keycloak.KeycloakProfile;
  public roles: string[];
  public person: IPerson;

  constructor(
    private modalService: NgbModal,
    private httpClient: HttpClient,
    private keycloakService: KeycloakService) {
  }

  public get fullName(): string {
    if (this.loggedIn && this.profile) {
      return `${this.profile.firstName} ${this.profile.lastName}`;
    }

    return 'Not logged in';
  }

  public get isAdmin() {
    return this.roles && this.roles.indexOf('admin') >= 0;
  }

  public login() {
    this.keycloakService.login();
  }

  public logout() {
    this.keycloakService.logout();
    this.loggedIn = false;
    this.profile = null;
    this.person = null;
    this.roles = [];
    localStorage.removeItem('kc.token');
    localStorage.removeItem('kc.idToken');
    localStorage.removeItem('kc.refreshToken');
  }

  public checkSession() {
    const createUser = () => {
      const modalRef = this.modalService.open(CreatePersonComponent, { size: 'lg', backdrop: 'static'});
      modalRef.componentInstance.profile = this.profile;

      modalRef.result
        .then((person: IPerson) => this.person = person)
        .catch((err) => console.error(err));
    };

    this.keycloakService.isLoggedIn()
      .then((loggedIn) => {
        this.loggedIn = loggedIn;

        if (loggedIn) {
          return Promise.all([
            this.keycloakService.loadUserProfile(),
            this.keycloakService.getUserRoles(true)
          ]);
        }
      })
      .then((data) => {
        if (data) {
          this.profile = <Keycloak.KeycloakProfile> data[0];
          this.roles = <string[]> data[1];

          const kc = this.keycloakService.getKeycloakInstance();
          localStorage.setItem('kc.token', kc.token);
          localStorage.setItem('kc.idToken', kc.idToken);
          localStorage.setItem('kc.refreshToken', kc.refreshToken);

          this.httpClient.get<IPerson>('/api/user/me').toPromise()
            .then((person) => {
              this.person = person;
            })
            .catch((err) => {
              if (err.status === 404) {
                createUser();
              } else {
                console.error(err);
              }
            });
        }
      })
      .catch((err) => {
        console.error(err);
      });
  }
}
