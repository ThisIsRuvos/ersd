import { All, Controller } from '@nestjs/common';

@Controller('fhir')
export class FhirController {
  @All()
  getData() {
    return 'this is another test';
  }
}
