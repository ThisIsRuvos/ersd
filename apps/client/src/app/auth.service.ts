import { Injectable } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { Keycloak } from 'keycloak-angular/lib/core/services/keycloak.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public loggedIn: boolean;
  public profile: Keycloak.KeycloakProfile;
  public roles: string[];

  constructor(private keycloakService: KeycloakService) {
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
    localStorage.removeItem('kc.token');
    localStorage.removeItem('kc.idToken');
    localStorage.removeItem('kc.refreshToken');
  }

  public checkSession() {
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
        }
      })
      .catch((err) => {
        console.error(err);
      });
  }
}
