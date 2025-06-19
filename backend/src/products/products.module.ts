import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { PrismaClient } from 'generated/prisma';
import { ApiResponseService } from '../shared/api-response.services';
import { CloudinaryModule } from 'src/shared/cloudinary/cloudinary.module';

@Module({
  imports: [
    ConfigModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
    CloudinaryModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService, PrismaClient, ApiResponseService],
  exports: [ProductsService],
})
export class ProductsModule {}
