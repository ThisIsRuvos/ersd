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
import { environment } from '../environments/environment';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from './auth.service';

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

export function initializer(keycloak: KeycloakService): () => Promise<any> {
  const token = localStorage.getItem('kc.token');
  const idToken = localStorage.getItem('kc.idToken');
  const refreshToken = localStorage.getItem('kc.refreshToken');

  return (): Promise<any> => keycloak.init({
    config: environment.keycloak,
    initOptions: {
      onLoad: 'check-sso',
      checkLoginIframe: false,
      token: token,
      idToken: idToken,
      refreshToken: refreshToken
    },
    bearerExcludedUrls: []
  });
}

@NgModule({
  declarations: [AppComponent, AdminComponent, SubscriptionComponent, ApiKeysComponent, HomeComponent, ContactInfoComponent],
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
      deps: [KeycloakService]
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
