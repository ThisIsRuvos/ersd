import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserController } from './user/user.controller';
import { FhirController } from './fhir/fhir.controller';
import { AuthModule } from './auth-module/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [AppController, UserController, FhirController],
  providers: [AppService],
})
export class AppModule {}
