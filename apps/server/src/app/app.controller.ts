import { Controller, Get } from '@nestjs/common';
import * as config from 'config';
import { IClientConfig } from '../../../../libs/ersdlib/src/lib/client-config';
import path from "path";
import * as fs from 'fs';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private appService: AppService) {}

  @Get('config')
  getClientConfig(): IClientConfig {
    const rctcExcelPath = path.resolve(this.appService.serverConfig.rctcExcelPath);
    this.appService.clientConfig.hasExcelDownload = fs.existsSync(rctcExcelPath);

    return this.appService.clientConfig;
  }
}
