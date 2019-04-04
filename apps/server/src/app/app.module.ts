import { HttpModule, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserController } from './user/user.controller';
import { FhirController } from './fhir/fhir.controller';
import { AuthModule } from './auth-module/auth.module';
import { SubscriptionController } from './subscription/subscription.controller';

@Module({
  imports: [AuthModule, HttpModule],
  controllers: [AppController, UserController, FhirController, SubscriptionController],
  providers: [AppService],
})
export class AppModule {}
