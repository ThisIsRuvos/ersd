import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserController } from './user/user.controller';
import { FhirController } from './fhir/fhir.controller';


@Module({
  imports: [],
  controllers: [AppController, UserController, FhirController],
  providers: [AppService],
})
export class AppModule {}
