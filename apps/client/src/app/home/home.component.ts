import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';
import { HttpClient } from '@angular/common/http';

@Component({
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  constructor(
    private httpClient: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit() {}

  request: any = {};

  download() {
    this.httpClient
      .post('/api/download', this.request)
      .toPromise()
      .then(() => {
        console.log('successfully sent download post request');
      })
      .catch(err => {
        console.log(err);
      });
  }
}
