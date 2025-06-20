import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PrismaClient } from 'generated/prisma';
import { ApiResponseService } from '../shared/api-response.services';
import { MailerModule } from '../shared/mailer/mailer.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [MailerModule, AuthModule],
  controllers: [OrdersController],
  providers: [OrdersService, PrismaClient, ApiResponseService],
  exports: [OrdersService],
})
export class OrdersModule {}
