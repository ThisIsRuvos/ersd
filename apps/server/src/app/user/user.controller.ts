import { Controller, Get } from '@nestjs/common';

@Controller('user')
export class UserController {
  @Get()
  getData() {
    return 'this is a test';
  }
}
