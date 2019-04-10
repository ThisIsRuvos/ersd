import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import * as bodyParser from 'body-parser';
import * as path from 'path';
import * as config from 'config';
import { IServerConfig } from './app/server-config';

const serverConfig = <IServerConfig> config.get('server');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix(`api`);

  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb ', extended: true }));
  app.useStaticAssets(path.join(__dirname, '/../client'));

  const port = process.env.port || serverConfig.port || 3333;
  await app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`);
  });
}

bootstrap();
