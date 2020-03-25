import { Component, OnInit } from '@angular/core';
import { AuthService } from './auth.service';
import { HttpClient } from '@angular/common/http';

// import { IDownloadRequest } from '../../../../../libs/ersdlib/src/lib/download-request';
import { IDownloadRequest } from '../../../../libs/ersdlib/src/lib/download-request';

@Component({
  selector: 'ersd-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  constructor(
    private httpClient: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.checkSession();
  }

  request: IDownloadRequest = {
    fileContent: 'Download Content',
    fileName: 'Downloaded File Name',
    message: 'Download Message'
  };

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
