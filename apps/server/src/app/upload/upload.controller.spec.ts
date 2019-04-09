import { Test, TestingModule } from '@nestjs/testing';
import { UploadController } from './upload.controller';

describe('Subscription Controller', () => {
  let module: TestingModule;
  
  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [UploadController],
    }).compile();
  });
  it('should be defined', () => {
    const controller: UploadController = module.get<UploadController>(UploadController);
    expect(controller).toBeDefined();
  });
});
