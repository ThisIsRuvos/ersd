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

    interface PayloadDownload {
      url: string;
    };

    this.httpClient
      .post('/api/download', this.request)
      .toPromise()
      .then((data: PayloadDownload) => {
        console.log('Downloading');
        var a = document.createElement('a');
        a.href = data.url;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        a.parentNode.removeChild(a);
      })
      .catch(err => {
        console.log(err);
      });
  }
}
