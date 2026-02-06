import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { delay } from 'rxjs/operators';
// import { LoadingService } from '../loading-spinner/loading.service';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '../config.service';

interface PayloadDownload {
  url: string;
  resp: any;
}

@Component({
  selector: 'ersd-spec-download',
  templateUrl: './spec-download.component.html',
  styleUrls: ['./spec-download.component.css'],
  standalone: false
})
export class SpecDownloadComponent implements OnInit {
  request: any = {}
  loadingDownloadJSON: boolean = false;
  loadingDownloadXML: boolean = false;
  loadingDownloadSpreadsheet: boolean = false;
  version = 'ecrv3'

  constructor(
    private httpClient: HttpClient,
    // private _loading: LoadingService,
    public configService: ConfigService
  ) { }

  ngOnInit() {
  }

  async downloadJSON() {
    try {
      const url = `/api/s3/json?version=${this.version}`;
      this.loadingDownloadJSON = true;
      const data = await firstValueFrom(this.httpClient.post(url, this.request)) as PayloadDownload;
      this.loadingDownloadJSON = false;
      await this.downloadS3(data);
    } catch (err) {
      this.loadingDownloadJSON = false;
      alert(`Error while downloading JSON file: ${err.message}`);
      console.error(err);
    }
  }

  async downloadXML() {
    try {
      const url = `/api/s3/xml?version=${this.version}`;
      this.loadingDownloadXML = true;
      const data = await firstValueFrom(this.httpClient.post(url, this.request)) as PayloadDownload;
      this.loadingDownloadXML = false;
      await this.downloadS3(data);
    } catch (err) {
      this.loadingDownloadXML = false;
      alert(`Error while downloading XML file: ${err.message}`);
      console.error(err);
    }
  }

  async downloadReleaseNotes(description: string) {
    try {
      if (description !== 'ersdv3') {
        throw new Error('Only eRSD Version 3 release notes are available');
      }
      const url = `api/download/release_notes?version=${description}`;
      const data = await firstValueFrom(this.httpClient.post(url, this.request)) as PayloadDownload;
      await this.downloadS3(data);

    } catch (err) {
      console.error(err);
    }
  }

  async downloadChangeLogs() {
    try {
      const data = await firstValueFrom(this.httpClient.post('api/download/change_logs', this.request)) as PayloadDownload;
      await this.downloadS3(data);
    } catch (err) {
      console.error(err);
    }
  }

  async downloadS3(data: PayloadDownload) {
    var a = document.createElement('a');
    a.href = data.url;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.parentNode.removeChild(a);
  }

  // RCTC Spreadsheet specific function.
  // This will be removed when the spreadsheet is removed
  async downloadRCTCReleaseSpreadsheet() {
    try {
      this.loadingDownloadSpreadsheet = true
      const data = await firstValueFrom(this.httpClient.post('/api/download/excel', this.request)) as PayloadDownload;
      this.loadingDownloadSpreadsheet = false
      await this.downloadS3(data);
    } catch (err) {
      console.log(err);
    }
  }


}
