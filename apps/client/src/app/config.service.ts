import { Injectable } from '@angular/core';
import { IClientConfig } from '../../../../libs/ersdlib/src/lib/client-config';

@Injectable({
  providedIn: 'root'
})
export class ConfigService implements IClientConfig {
  hasExcelDownload: boolean;
  keycloak: { url: string; realm: string; clientId: string };
}
