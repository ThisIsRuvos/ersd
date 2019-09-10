import { Test, TestingModule } from '@nestjs/testing';
import { ApiKeysController } from './api-keys.controller';
import { HttpModule } from '@nestjs/common';
import { AppService } from '../app.service';
import { PassportModule } from '@nestjs/passport';

describe('Subscription Controller', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [ApiKeysController],
      imports: [HttpModule, PassportModule.register({ defaultStrategy: 'jwt' })],
      providers: [AppService]
    }).compile();
  });
  it('should be defined', () => {
    const controller: ApiKeysController = module.get<ApiKeysController>(ApiKeysController);
    expect(controller).toBeDefined();
  });
});
