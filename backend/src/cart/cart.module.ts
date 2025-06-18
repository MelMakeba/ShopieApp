import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { ApiResponseService } from 'src/shared/api-response.services';

@Module({
  providers: [CartService, ApiResponseService],
  controllers: [CartController],
})
export class CartModule {}
