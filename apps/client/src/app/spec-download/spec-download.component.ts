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
  request: any = {}

  showV2 = false
  version = 'ecrv1'
  bundleType = ''
  contentType = 'json'

  constructor(
    private httpClient: HttpClient
  ) { }

  ngOnInit() {
  }

  setBundle(e) { this.bundleType = e.target.value }

  setVersion(e) { this.version = e.target.value }

  setContentType(e) { this.contentType = e.target.value }

  buildFileName() {
    if (this.bundleType !== '') {
      return `${this.version}-${this.bundleType}.${this.contentType}`
    }
    return `${this.version}.${this.contentType}`
  }

  async handleSubmit() {
    let url = ''
    try {
      if (this.version == 'ecrv2') {
        // when V2 Supplemental goes live: if(this.bundleType == '') { throw Error('Please select a bundle type') } 
        url = `/api/s3/${this.contentType}?version=${this.version}`
        // when V2 Supplemental goes live: url = `/api/s3/${this.contentType}?version=${this.version}&bundle=${this.bundleType}`
      } else {
        url = `/api/s3/${this.contentType}?version=${this.version}`
      }
      if (this.contentType === 'json') {
        return this.queryServer(url)
      } else {
        return this.queryServerXML(url)
      }
    } catch (err) {
      alert(`Error while downloading file: ${err.message}`);
      console.error(err);
    }
  }

  async downloadFile(data, filename?) {
    let blob: Blob;
    if (this.contentType === 'json') {
      blob = new Blob([JSON.stringify(data, null, 2)],{ type: 'application/json;charset=utf-8' })
    } else if (this.contentType === 'xml') {
      blob = new Blob([data],{ type: 'text/xml' })
    }
    saveAs(blob, filename);
  }

  async queryServer(url) {
    this.httpClient
      .post(url, this.request)
      .toPromise()
      .then(async (data) => {
        await this.downloadFile(data, this.buildFileName())
      })
      .catch(err => {
        console.error(err);
      });
  }

  async queryServerXML(url) {
    try {
      this.httpClient
        .get(url, { responseType: 'text' })
        .subscribe(async result => {
          await this.downloadFile(result, this.buildFileName())
        })
    } catch (err) {
      alert(`Error downloading file: ${err.message}`)
      console.error(err)
    }
  }

  // RCTC Spreadsheet specific functions
  async downloadExcel() {
    this.httpClient
    .post('/api/download/excel', this.request)
    .toPromise()
    .then(async (data: PayloadDownload) => {
        await this.handleExcelDownload(data.url, 'rctc.xlsx')
      })
      .catch(err => {
        console.log(err);
      });
  }
  
  async handleExcelDownload(data, filename) {
    const url = data.url
    console.log('Downloading');
    if (url.includes('local')) {
      return await this.downloadLocal(url, filename)
    }
    else {
      return await this.downloadS3(url)
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
  
  async downloadLocal(url, filename) {
    try {
      const results = await this.httpClient.get(url, { responseType: 'blob' }).toPromise();
      saveAs(results, filename);
    } catch (ex) {
      alert(`Error while downloading excel file: ${ex.message}`);
      console.error(ex);
    }
  }
}
