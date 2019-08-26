import {NestFactory} from '@nestjs/core';
import {AppModule} from './app/app.module';
import {IServerConfig} from './app/server-config';
import {Logger} from '@nestjs/common';

import * as bodyParser from 'body-parser';
import * as path from 'path';
import * as config from 'config';
import { CheckContactInfo } from './check-contact-info';
import { IEmailConfig } from './app/email-config';

const serverConfig = <IServerConfig> config.server;
const emailConfig = <IEmailConfig> config.email;
const logger = new Logger('bootstrap');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix(`api`);

  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb ', extended: true }));
  app.useStaticAssets(path.join(__dirname, '/../client'));

  const port = process.env.port || serverConfig.port || 3333;
  await app.listen(port, () => {
    logger.log(`Listening at http://localhost:${port}`);
    logger.log(`Server configured to use FHIR server ${serverConfig.fhirServerBase}`);
  });
}

if (!serverConfig.fhirServerBase) {
  logger.error('Server is not configured with a FHIR server. Cannot continue');
  process.exit(1);
}

bootstrap()
  .then(() => {
    CheckContactInfo.execute(serverConfig.fhirServerBase, serverConfig.contactInfo, emailConfig);
  });
