import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ApiResponseService } from 'src/shared/api-response.services';

@Module({
  providers: [AuthService, ApiResponseService],
  controllers: [AuthController],
})
export class AuthModule {}
