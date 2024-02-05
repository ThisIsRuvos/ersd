import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UserSubscriptions } from '../../../../../libs/ersdlib/src/lib/user-subscriptions';
import { NgModel } from '@angular/forms';
// import { getErrorString } from '../../../../../libs/ersdlib/src/lib/get-error-string';
import { generateKey } from '../../../../../libs/ersdlib/src/lib/generate-key';
import { AuthService } from '../auth.service';
import { formatPhone } from '../../../../../libs/ersdlib/src/lib/helper';
import { IPerson, Person } from '../../../../../libs/ersdlib/src/lib/person';
import { Constants } from 'libs/ersdlib/src/lib/constants';
import { ToastrService } from 'ngx-toastr';
import { EditPersonComponent } from '../edit-person/edit-person.component';
import { firstValueFrom } from 'rxjs';


@Component({
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit {
  public userSubscriptions: UserSubscriptions = new UserSubscriptions();
  public person: Person;
  // public message: string;
  // public messageIsError: boolean;
  public generateKey = generateKey;
  
  @ViewChild('editPerson') editPersonField: EditPersonComponent;

  @ViewChild('emailAddress') emailAddressField: NgModel;
  @ViewChild('restEndpoint') endpointField: NgModel;
  loading: boolean = false;

  constructor(private httpClient: HttpClient, private authService: AuthService, private toastr: ToastrService) { }

  get isUserValid() {
    return this.editPersonField && this.editPersonField.isValid;
  }

  get isValid() {
    if (!this.userSubscriptions.emailSubscription) {
      return false;
    }

    return (!this.emailAddressField || this.emailAddressField.valid) &&
      (!this.endpointField || this.endpointField.valid);
  }

  async saveContact() {
    try { 
      this.loading = true; 
      const person = await firstValueFrom(this.httpClient.post<Person>('/api/user/me', this.person));
      this.loading = false; 
      this.person = new Person(person);
      this.toastr.success('User details updated successfully!');
      this.authService.checkSession();
      window.scrollTo(0, 0);
    } catch (err) {
      this.toastr.error('Failed to update user details!');      
      window.scrollTo(0, 0);
    }
  }

    // sms functionality removed
  async saveSubscription() {
    try { 
      this.loading = true; 
      await firstValueFrom(this.httpClient.post('/api/subscription', this.userSubscriptions));
      this.loading = false; 
      this.toastr.success('Notification details updated successfully!');
      window.scrollTo(0, 0);
    } catch (err) {
      this.toastr.error('Failed to update notification details!');
      window.scrollTo(0, 0);
    }
  }


  public get secondary(): Person | undefined {
    const extension = this.person?.extension?.find(extension => extension.url === Constants.extensions.secondaryContact);
    const reference = extension?.valueReference?.reference;

    if (extension && reference?.startsWith('#') && this.person?.contained) {
      const containedId = reference.substring(1);
      return this.person.contained.find(contained => contained.id === containedId) as Person;
    }

    return undefined;
  }

  async ngOnInit() {
    try {
      const [personResponse, subscriptionsResponse] = await Promise.all([
        this.httpClient.get<IPerson>('/api/user/me').toPromise(),
        this.httpClient.get<UserSubscriptions>('/api/subscription').toPromise()
      ]);

      this.person = new Person(personResponse);
      this.userSubscriptions = subscriptionsResponse;

    } catch (err) {

      this.toastr.error(err);
      console.error(err);
    }
  }

  // getContactEmails() {
  //   // Retrieving email from the root telecom array
  //   const primaryEmail = this.person.telecom.find(item => item.system === 'email');
  //   this.primaryEmailAddress = primaryEmail ? primaryEmail.value : null;

  //   // Retrieving email from the telecom array within contained object
  //   const secondaryPerson = this.person?.contained?.find(item => item.resourceType === 'Person') as Person;
  //   const secondaryEmail = secondaryPerson ? secondaryPerson.telecom.find(item => item.system === 'email') : null;
  //   this.secondaryEmailAddress = secondaryEmail ? secondaryEmail.value : null;
  // }

  // users cant delete thier profile????? Ask Adam
  public delete() {

    const currentUserPersonId = this.authService.person ? this.authService.person.id : null;

    if (currentUserPersonId === this.person.id) {
      // replace with toast
      // this.message = 'You cannot delete yourself!';
      // this.messageIsError = true;
      window.scrollTo(0, 0);
      return;
    }

    if (!confirm('Are you sure you want to delete your account? You will no longer receive any notifications/communications from ERSD.')) {
      return;
    }

    this.httpClient.delete('/api/user/me').toPromise()
      .then(() => {
        this.authService.logout();
      });
  }
}
