import { Component, OnInit } from '@angular/core';
import { AuthService } from './auth.service';
import { HttpClient } from '@angular/common/http';
import packageInfo from "../../../../package.json";

@Component({
  selector: 'ersd-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  versionText = 'eRSD Version: '+packageInfo.version;
  constructor(public authService: AuthService) {}

  ngOnInit(): void {
    this.authService.checkSession();
  }
}
