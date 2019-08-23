import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IUserApiKeys } from '../../../../../libs/ersdlib/src/lib/user-api-keys';
import { getErrorString } from '../../../../../libs/ersdlib/src/lib/get-error-string';
import { generateKey } from '../../../../../libs/ersdlib/src/lib/generate-key';

@Component({
  templateUrl: './api-keys.component.html',
  styleUrls: ['./api-keys.component.css']
})
export class ApiKeysComponent implements OnInit {
  public apiKeys: IUserApiKeys = {};
  public message: string;
  public messageIsError: boolean;
  public generateKey = generateKey;
  public baseAddress: string;

  constructor(private httpClient: HttpClient) { }

  save() {
    this.message = null;
    this.messageIsError = false;

    this.httpClient.post<IUserApiKeys>('/api/api-keys', this.apiKeys).toPromise()
      .then((apiKeys) => {
        this.apiKeys = apiKeys;
        this.message = 'Saved API Keys!';
        this.messageIsError = false;
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
      })

    this.baseAddress = location.origin + '/api/fhir';
  }
}
