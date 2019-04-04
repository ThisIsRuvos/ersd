import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UserSubscriptions } from '../../../../../libs/kdslib/src/lib/user-subscriptions';

@Component({
  selector: 'kds-subscription',
  templateUrl: './subscription.component.html',
  styleUrls: ['./subscription.component.css']
})
export class SubscriptionComponent implements OnInit {
  public userSubscriptions: UserSubscriptions = {};

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<UserSubscriptions>('/api/subscription').toPromise()
      .then((response) => {
        this.userSubscriptions = response;
      })
      .catch((err) => {
        console.error(err);
      });
  }
}
