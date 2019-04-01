import { Test, TestingModule } from '@nestjs/testing';
import { FhirController } from './fhir.controller';

describe('Fhir Controller', () => {
  let module: TestingModule;
  
  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [FhirController],
    }).compile();
  });
  it('should be defined', () => {
    const controller: FhirController = module.get<FhirController>(FhirController);
    expect(controller).toBeDefined();
  });
});
