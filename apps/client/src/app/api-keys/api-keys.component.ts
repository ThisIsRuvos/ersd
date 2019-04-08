import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IUserApiKeys } from '../../../../../libs/kdslib/src/lib/user-api-keys';
import { getErrorString } from '../../../../../libs/kdslib/src/lib/get-error-string';

@Component({
  selector: 'kds-api-keys',
  templateUrl: './api-keys.component.html',
  styleUrls: ['./api-keys.component.css']
})
export class ApiKeysComponent implements OnInit {
  public apiKeys: IUserApiKeys = {};
  public message: string;
  public messageIsError: boolean;

  constructor(private httpClient: HttpClient) { }

  generateKey() {
    const keyPattern = 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx2xxxxxxxxxxxxxxxxxxx';
    let d = new Date().getTime();

    if (window.performance && typeof window.performance.now === "function") {
      d += performance.now();
    }

    const uuid = keyPattern.replace(/[xy]/g, function(c) {
      const r = (d + Math.random()*16)%16 | 0;
      d = Math.floor(d/16);
      return (c === 'x' ? r : (r&0x3|0x8)).toString(16);
    });

    return uuid;
  }

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
  }
}
