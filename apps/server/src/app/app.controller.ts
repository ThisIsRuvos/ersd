import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import * as config from 'config';
import { IClientConfig } from '../../../../libs/ersdlib/src/lib/client-config';

const clientConfig = <IClientConfig> config.get('client');

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('config')
  getClientConfig(): IClientConfig {
    return clientConfig;
  }
}
