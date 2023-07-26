import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';
import { ConfigService } from '../config.service';

@Component({
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  request: any = {};

  constructor(
    public authService: AuthService,
    public configService: ConfigService
  ) {}

  ngOnInit() {}

}
