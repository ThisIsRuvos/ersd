import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { HttpModule } from '@nestjs/common';
import { AppService } from '../app.service';
import { PassportModule } from '@nestjs/passport';

describe('User Controller', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [UserController],
      imports: [HttpModule, PassportModule.register({ defaultStrategy: 'jwt' })],
      providers: [AppService]
    }).compile();
  });
  it('should be defined', () => {
    const controller: UserController = module.get<UserController>(UserController);
    expect(controller).toBeDefined();
  });
});
