import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt'; // Add this import
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { ApiResponseService } from 'src/shared/api-response.services';
import { PrismaClient } from 'generated/prisma';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [UsersService, ApiResponseService, PrismaClient, ConfigService],
  controllers: [UsersController],
})
export class UsersModule {}
