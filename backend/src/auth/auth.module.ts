import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ApiResponseService } from 'src/shared/api-response.services';
import { JwtAuthGuard } from './guards/jwt-guard/jwt-guard.guard';
import { RoleGuard } from './guards/role-guard/role-guard.guard';
import { PrismaClient } from 'generated/prisma';
import { MailerModule } from '../shared/mailer/mailer.module';

@Module({
  imports: [
    ConfigModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
    MailerModule,
  ],
  providers: [
    AuthService,
    ApiResponseService,
    JwtAuthGuard,
    RoleGuard,
    PrismaClient,
    ConfigService,
  ],
  controllers: [AuthController],
  exports: [JwtAuthGuard, JwtModule, ConfigService],
})
export class AuthModule {}
