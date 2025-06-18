import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { ApiResponseService } from 'src/shared/api-response.services';

@Module({
  providers: [UsersService, ApiResponseService],
  controllers: [UsersController],
})
export class UsersModule {}
