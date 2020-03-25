import {
  Body,
  Controller,
  HttpService,
  Logger,
  Post,
  Req,
  UseGuards
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthRequest } from '../auth-module/auth-request';
import { AppService } from '../app.service';
import { IDownloadRequest } from '../../../../../libs/ersdlib/src/lib/download-request';

@Controller('download')
export class DownloadController {
  constructor(
    private httpService: HttpService,
    private appService: AppService
  ) {}

  @Post()
  @UseGuards(AuthGuard())
  async download(@Req() request: AuthRequest, @Body() body: IDownloadRequest) {
    console.log(body);
  }
}
