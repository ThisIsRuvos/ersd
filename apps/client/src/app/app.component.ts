import { Component, OnInit } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { ActivatedRoute, Route } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'ersd-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  constructor(public authService: AuthService) {

  }

  ngOnInit(): void {
    this.authService.checkSession();
  }
}
