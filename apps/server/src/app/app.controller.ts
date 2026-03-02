import { Controller, Get } from '@nestjs/common';
import * as config from 'config';
import type { IClientConfig } from '../../../../libs/ersdlib/src/lib/client-config';
import path from "path";
import * as fs from 'fs';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private appService: AppService) { }

  @Get('health')
  getHealth(): { status: string } {
    return { status: 'ok' };
  }

  @Get('config')
  getClientConfig(): IClientConfig {
    const rctcExcelPath = path.resolve(this.appService.serverConfig.rctcExcelPath);
    this.appService.clientConfig.hasExcelDownload = fs.existsSync(rctcExcelPath);
    this.appService.clientConfig.serveV3 = this.appService.serverConfig.serveV3;
    return this.appService.clientConfig;
  }
}
