import { Test, TestingModule } from '@nestjs/testing';
import { FhirController } from './fhir.controller';
import { AppService } from '../app.service';
import { HttpModule } from '@nestjs/axios';

describe('Fhir Controller', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [FhirController],
      imports: [HttpModule],
      providers: [AppService]
    }).compile();
  });
  it('should be defined', () => {
    const controller: FhirController = module.get<FhirController>(FhirController);
    expect(controller).toBeDefined();
  });
});
