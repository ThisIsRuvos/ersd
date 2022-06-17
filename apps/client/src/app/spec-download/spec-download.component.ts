import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import saveAs from 'save-as';

interface PayloadDownload {
  url: string;
}

@Component({
  selector: 'ersd-spec-download',
  templateUrl: './spec-download.component.html',
  styleUrls: ['./spec-download.component.css']
})
export class SpecDownloadComponent implements OnInit {
  request: any = {};

  constructor(
    private httpClient: HttpClient
  ) { }

  ngOnInit() {
  }

  async downloadFile(data, filename) {
    const url = data.url
    console.log('Downloading');
    // if (url.includes('local')) {
    //   return await this.downloadLocal(url, filename)
    // }
    // else {
      return await this.downloadS3(url)
    // }
  }
  async downloadLocal(url, filename) {
    try {
      const results = await this.httpClient.get(url, { responseType: 'blob' }).toPromise();
      saveAs(results, filename);
    } catch (ex) {
      alert(`Error while downloading file: ${ex.message}`);
      console.error(ex);
    }
  }
  async downloadS3(url) {
    var a = document.createElement('a');
    a.href = url;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.parentNode.removeChild(a);
  }

  async downloadExcel() {
    this.httpClient
      .post('/api/download/excel', this.request)
      .toPromise()
      .then(async (data: PayloadDownload) => {
        await this.downloadFile(data, 'rctc.xlsx')
      })
      .catch(err => {
        console.log(err);
      });
  }

  async downloadJsonBundle() {
    this.httpClient
      .post('/api/download/jsonbundle', this.request)
      .toPromise()
      .then(async (data: PayloadDownload) => {
        await this.downloadFile(data, 'bundle.json')
      })
      .catch(err => {
        console.log(err);
      });
  }

  async downloadXmlBundle() {
    this.httpClient
      .post('/api/download/xmlbundle', this.request)
      .toPromise()
      .then(async (data: PayloadDownload) => {
        await this.downloadFile(data, 'bundle.xml')
      })
      .catch(err => {
        console.log(err);
      });
  }
}
