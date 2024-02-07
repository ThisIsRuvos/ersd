import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserController } from './user/user.controller';
import { FhirController } from './fhir/fhir.controller';
import { AuthModule } from './auth-module/auth.module';
// import { loadEsmModule } from './helper'
import { SubscriptionController } from './subscription/subscription.controller';
import { ApiKeysController } from './api-key/api-keys.controller';
import { UploadController } from './upload/upload.controller';
import { DownloadController } from './download/download.controller';
import { S3Controller } from './s3/s3.controller';
import { eRSDController } from './ersd/ersd.controller';

@Module({
  imports: [AuthModule, HttpModule],
  controllers: [
    AppController,
    UserController,
    FhirController,
    S3Controller,
    eRSDController,
    SubscriptionController,
    ApiKeysController,
    UploadController,
    DownloadController
  ],
  providers: [AppService],
})
export class AppModule {}
