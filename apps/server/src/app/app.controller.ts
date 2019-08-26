import { Controller, Get } from '@nestjs/common';
import * as config from 'config';
import { IClientConfig } from '../../../../libs/ersdlib/src/lib/client-config';

const clientConfig = <IClientConfig> config.client;

@Controller()
export class AppController {
  constructor() {}

  @Get('config')
  getClientConfig(): IClientConfig {
    return clientConfig;
  }
}
