import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { ApiResponseService } from 'src/shared/api-response.services';

@Module({
  providers: [ProductsService, ApiResponseService],
  controllers: [ProductsController],
})
export class ProductsModule {}
