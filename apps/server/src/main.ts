import {NestFactory} from '@nestjs/core';
import {AppModule} from './app/app.module';
import {IServerConfig} from './app/server-config';
import {Logger} from '@nestjs/common';

import * as bodyParser from 'body-parser';
import * as path from 'path';
import * as config from 'config';

const serverConfig = <IServerConfig> config.get('server');

async function bootstrap() {
  const logger = new Logger('bootstrap');
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

bootstrap();
