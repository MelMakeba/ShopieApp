import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { PrismaClient } from 'generated/prisma';
import { ApiResponseService } from '../shared/api-response.services';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [CartController],
  providers: [CartService, PrismaClient, ApiResponseService],
})
export class CartModule {}
