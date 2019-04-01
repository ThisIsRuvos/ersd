import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { AdminComponent } from './admin/admin.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { RouterModule, Routes } from '@angular/router';
import { SubscriptionComponent } from './subscription/subscription.component';
import { ApiKeysComponent } from './api-keys/api-keys.component';
import { HomeComponent } from './home/home.component';
import { ContactInfoComponent } from './contact-info/contact-info.component';
import { FormsModule } from '@angular/forms';

const appRoutes: Routes = [
  { path: 'admin',            component: AdminComponent },
  { path: 'subscription',     component: SubscriptionComponent },
  { path: 'api-keys',         component: ApiKeysComponent },
  { path: 'contact-info',     component: ContactInfoComponent },
  { path: 'home',             component: HomeComponent },
  { path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  }
];

@NgModule({
  declarations: [AppComponent, AdminComponent, SubscriptionComponent, ApiKeysComponent, HomeComponent, ContactInfoComponent],
  imports: [
    BrowserModule,
    FormsModule,
    NgbModule,
    RouterModule.forRoot(appRoutes, { enableTracing: true, useHash: true }),
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
