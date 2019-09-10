import { Test } from '@nestjs/testing';

import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;

  beforeAll(async () => {
    const app = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = app.get<AppService>(AppService);
  });

  describe('assertAdmin', () => {
    it('should throw an error when the user is not an admin', () => {

    });
  });

  describe('buildFhirUrl', () => {
    it('should create a properly formatted fhir server url', () => {

    });
  });
});
