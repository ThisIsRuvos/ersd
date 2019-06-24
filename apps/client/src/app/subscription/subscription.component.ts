import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UserSubscriptions } from '../../../../../libs/kdslib/src/lib/user-subscriptions';
import { NgModel } from '@angular/forms';
import { getErrorString } from '../../../../../libs/kdslib/src/lib/get-error-string';
import { generateKey } from '../../../../../libs/kdslib/src/lib/generate-key';

@Component({
  selector: 'kds-subscription',
  templateUrl: './subscription.component.html',
  styleUrls: ['./subscription.component.css']
})
export class SubscriptionComponent implements OnInit {
  public userSubscriptions: UserSubscriptions = new UserSubscriptions();
  public message: string;
  public messageIsError: boolean;
  public generateKey = generateKey;

  @ViewChild('emailAddress') emailAddressField: NgModel;
  @ViewChild('restEndpoint') endpointField: NgModel;
  @ViewChild('carrier') carrierField: NgModel;
  @ViewChild('mobile') mobileField: NgModel;

  constructor(private httpClient: HttpClient) {}

  public toggleRest(value: boolean) {
    if (this.userSubscriptions.restSubscription && !value) {
      delete this.userSubscriptions.restSubscription;
    } else if (!this.userSubscriptions.restSubscription && value) {
      this.userSubscriptions.restSubscription = {};
    }
  }

  public toggleSms(value: boolean) {
    if (this.userSubscriptions.smsSubscription && !value) {
      delete this.userSubscriptions.smsSubscription;
    } else if (!this.userSubscriptions.smsSubscription && value) {
      this.userSubscriptions.smsSubscription = { };
    }
  }

  get isValid() {
    if (!this.userSubscriptions.emailSubscription && !this.userSubscriptions.restSubscription && !this.userSubscriptions.smsSubscription) {
      return false;
    }

    return (!this.emailAddressField || this.emailAddressField.valid) &&
      (!this.endpointField || this.endpointField.valid) &&
      (!this.carrierField || this.carrierField.valid) &&
      (!this.mobileField || this.mobileField.valid);
  }

  save() {
    this.message = null;
    this.messageIsError = false;

    this.httpClient.post('/api/subscription', this.userSubscriptions).toPromise()
      .then(() => {
        this.message = 'Saved/updated subscriptions!';
        this.messageIsError = false;
        window.scrollTo(0, 0);
      })
      .catch((err) => {
        this.message = getErrorString(err);
        this.messageIsError = true;
        window.scrollTo(0, 0);
      });
  }

  ngOnInit() {
    this.httpClient.get<UserSubscriptions>('/api/subscription').toPromise()
      .then((response) => {
        this.userSubscriptions = response;
      })
      .catch((err) => {
        console.error(err);
      });
  }
}
