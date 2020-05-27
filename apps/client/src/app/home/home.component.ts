import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from '../config.service';
import saveAs from 'save-as';

interface PayloadDownload {
  url: string;
}

@Component({
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  request: any = {};

  constructor(
    private httpClient: HttpClient,
    private authService: AuthService,
    public configService: ConfigService
  ) {}

  ngOnInit() {}

  async downloadExcel() {
    try {
      const results = await this.httpClient.get('/api/download/excel', { responseType: 'blob' }).toPromise();
      saveAs(results, 'rctc.xlsx');
    } catch (ex) {
      alert(`Error while downloading excel file: ${ex.message}`);
      console.error(ex);
    }
  }

  downloadBundle() {
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
