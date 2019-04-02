import { Component, OnInit } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';

@Component({
  selector: 'kds-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  private profile: Keycloak.KeycloakProfile;
  public loggedIn: boolean;

  constructor(public keycloakService: KeycloakService) {

  }

  public get fullName(): string {
    if (this.loggedIn && this.profile) {
      return `${this.profile.firstName} ${this.profile.lastName}`;
    }

    return 'Not logged in';
  }

  ngOnInit(): void {
    this.keycloakService.isLoggedIn()
      .then((loggedIn) => {
        this.loggedIn = loggedIn;

        if (loggedIn) {
          return this.keycloakService.loadUserProfile();
        }
      })
      .then((profile: Keycloak.KeycloakProfile) => {
        this.profile = profile;
      })
      .catch((err) => {
        console.error(err);
      });
  }
}
