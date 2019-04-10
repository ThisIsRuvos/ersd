import { BrowserModule } from '@angular/platform-browser';
import { APP_INITIALIZER, NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { AdminComponent } from './admin/admin.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { RouterModule, Routes } from '@angular/router';
import { SubscriptionComponent } from './subscription/subscription.component';
import { ApiKeysComponent } from './api-keys/api-keys.component';
import { HomeComponent } from './home/home.component';
import { ContactInfoComponent } from './contact-info/contact-info.component';
import { FormsModule } from '@angular/forms';
import { KeycloakAngularModule, KeycloakService } from 'keycloak-angular';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AuthService } from './auth.service';
import { CreatePersonComponent } from './create-person/create-person.component';
import { EditPersonComponent } from './edit-person/edit-person.component';
import { AdminEditPersonComponent } from './admin/edit-person/edit-person.component';
import { IClientConfig } from '../../../../libs/kdslib/src/lib/client-config';

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

export function initializer(keycloak: KeycloakService, httpClient: HttpClient): () => Promise<any> {
  const token = localStorage.getItem('kc.token');
  const idToken = localStorage.getItem('kc.idToken');
  const refreshToken = localStorage.getItem('kc.refreshToken');

  return (): Promise<any> => {
    return httpClient.get('/api/config').toPromise()
      .then((config: IClientConfig) => {
        return keycloak.init({
          config: config.keycloak,
          initOptions: {
            onLoad: 'check-sso',
            checkLoginIframe: false,
            token: token,
            idToken: idToken,
            refreshToken: refreshToken
          },
          bearerExcludedUrls: []
        });
      });
  };
}

@NgModule({
  entryComponents: [
    CreatePersonComponent,
    AdminEditPersonComponent
  ],
  declarations: [
    AppComponent,
    AdminComponent,
    SubscriptionComponent,
    ApiKeysComponent,
    HomeComponent,
    ContactInfoComponent,
    CreatePersonComponent,
    EditPersonComponent,
    AdminEditPersonComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    NgbModule,
    HttpClientModule,
    RouterModule.forRoot(appRoutes, { enableTracing: true, useHash: true }),
    FormsModule,
    KeycloakAngularModule
  ],
  providers: [
    AuthService,
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: initializer,
      deps: [KeycloakService, HttpClient]
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
