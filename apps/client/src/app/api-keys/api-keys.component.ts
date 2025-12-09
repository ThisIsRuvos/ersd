import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IUserApiKeys } from '../../../../../libs/ersdlib/src/lib/user-api-keys';
import { getErrorString } from '../../../../../libs/ersdlib/src/lib/get-error-string';
import { generateKey } from '../../../../../libs/ersdlib/src/lib/generate-key';
import { joinUrl } from '../../../../server/src/app/helper';
import { ConfigService } from '../config.service';

@Component({
  templateUrl: './api-keys.component.html',
  styleUrls: ['./api-keys.component.css'],
  standalone: false
})
export class ApiKeysComponent implements OnInit {
  public apiKeys: IUserApiKeys = {};
  public message: string;
  public messageIsError: boolean;
  public baseAddress: string;

  constructor(
    private httpClient: HttpClient,
    public configService: ConfigService
  ) {}

  get baseUrl() {
    return joinUrl(window.location.origin, '/api/fhir');
  }

  get s3BaseUrl() {
    return joinUrl(window.location.origin, '/api/ersd');
  }

  get exampleQuery() {
    const defaultOrigin = joinUrl(window.location.origin, '/fhir/Bundle');
    let exampleQuery = this.apiKeys ? this.apiKeys.exampleQuery || defaultOrigin : defaultOrigin;

    if (!exampleQuery.startsWith('http://') && !exampleQuery.startsWith('https://')) {
      exampleQuery = joinUrl(window.location.origin, exampleQuery);
    }

    if (exampleQuery.indexOf('?') < 0) {
      exampleQuery += '?';
    }

    if (!exampleQuery.endsWith('?')) {
      exampleQuery += '&';
    }

    exampleQuery += `api-key=${this.apiKeys.inbound || 'YOUR-API-KEY'}`;

    return exampleQuery;
  }

  generate() {
    this.apiKeys.inbound = generateKey();
    this.save();
  }

  save() {
    this.message = null;
    this.messageIsError = false;

    this.httpClient.post<IUserApiKeys>('/api/api-keys', this.apiKeys).toPromise()
      .then((apiKeys) => {
        this.apiKeys = apiKeys;
        this.message = 'Saved API Key!';
        this.messageIsError = false;
        setTimeout(() => {
          this.message = '';
        }, 5000);
      })
      .catch((err) => {
        this.message = getErrorString(err);
        this.messageIsError = true;
      });
  }

  ngOnInit() {
    this.httpClient.get<IUserApiKeys>('/api/api-keys').toPromise()
      .then((apiKeys) => this.apiKeys = apiKeys)
      .catch((err) => {
        this.message = getErrorString(err);
        this.messageIsError = true;
      });

    this.baseAddress = location.origin + '/api/fhir';
  }
}
