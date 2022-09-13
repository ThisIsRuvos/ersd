import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import saveAs from 'save-as';
import { delay } from 'rxjs/operators';
import { LoadingService } from '../loading-spinner/loading.service';

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
  loading: boolean = false;

  showV2 = false
  version = 'ecrv1'
  bundleType = ''
  contentType = 'json'

  constructor(
    private httpClient: HttpClient,
    private _loading: LoadingService
  ) { }

  ngOnInit() {
    this.listenToLoading();
  }

  setBundle(e) { this.bundleType = e.target.value }

  setVersion(e) { this.version = e.target.value }

  setContentType(e) { this.contentType = e.target.value }

   /**
   * Listen to the loadingSub property in the LoadingService class. This drives the
   * display of the loading spinner.
   */
    listenToLoading(): void {
      this._loading.loadingSub
        .pipe(delay(0)) // This prevents a ExpressionChangedAfterItHasBeenCheckedError for subsequent requests
        .subscribe((loading: boolean) => {
          this.loading = loading;
        });
    }

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
      return this.queryServer(url)

    } catch (err) {
      alert(`Error while downloading file: ${err.message}`);
      console.error(err);
    }
  }

  async downloadReleaseNotes() {
    this.httpClient
      .post('api/download/release_notes', this.request)
      .toPromise()
      .then(async (data: PayloadDownload) => {
        await this.downloadS3(data)
      })
      .catch(err => {
        console.error(err);
      });
  }

  async queryServer(url) {
    this.httpClient
      .post(url, this.request)
      .toPromise()
      .then(async (data: PayloadDownload) => {
        await this.downloadS3(data)
      })
      .catch(err => {
        console.error(err);
      });
  }

  // RCTC Spreadsheet specific functions
  async downloadExcel() {
    this.httpClient
      .post('/api/download/excel', this.request)
      .toPromise()
      .then(async (data: PayloadDownload) => {
          await this.downloadS3(data)
        })
        .catch(err => {
          console.log(err);
        });
  }

  async downloadS3(data: PayloadDownload) {
    var a = document.createElement('a');
    a.href = data.url;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.parentNode.removeChild(a);
  }
}
