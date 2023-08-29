import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionController } from './subscription.controller';
import { HttpModule } from '@nestjs/axios';
import { AppService } from '../app.service';
import { PassportModule } from '@nestjs/passport';

describe('Subscription Controller', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [SubscriptionController],
      imports: [HttpModule, PassportModule.register({ defaultStrategy: 'jwt' })],
      providers: [AppService]
    }).compile();
  });
  it('should be defined', () => {
    const controller: SubscriptionController = module.get<SubscriptionController>(SubscriptionController);
    expect(controller).toBeDefined();
  });
});
