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
  // THOUGHTS: we might just be able to dynamically generate the URL based on input
  // rather than searching through an object for URLs
  // eRSDVersions: Record<string, any> = {
  //   version_one: {
  //     xml: "",
  //     json: ""
  //   },
  //   version_two: {
  //     specification_bundle: {
  //       xml: "",
  //       json: ""
  //     } ,
  //     supplemental_bundle: {
  //       xml: "",
  //       json: ""
  //     }
  //   }
  // };

  version = "ecr-v1"
  bundleType = ""
  contentType = "json"

  constructor(
    private httpClient: HttpClient
  ) { }

  ngOnInit() {
  }

  setBundle(e) { this.bundleType = e.target.value }

  setVersion(e) { this.version = e.target.value }

  setContentType(e) { this.contentType = e.target.value }

  async handleSubmit() {
    try {
      if (this.version == "ecr-v2" && this.bundleType == "") { 
        throw Error('Please select a content type')
      }

      this.downloadS3('http://localhost:4568/test-bucket/bundle.json')
    } catch (err) {
      alert(`Error while downloading file: ${err.message}`);
      console.error(err);
    }
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
