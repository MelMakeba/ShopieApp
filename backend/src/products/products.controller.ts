import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFloatPipe,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { UpdateProductDto } from './dtos/update-product.dto';
import { SearchProductsDto } from './dtos/search-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-guard/jwt-guard.guard';
import { RoleGuard } from '../auth/guards/role-guard/role-guard.guard';
import { Roles } from '../auth/decorators/role.decorator';
import { multerOptionsForMemory } from '../shared/utils/file-uploads.utils';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // Admin only - Create product with image upload
  @Post()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('ADMIN')
  @UseInterceptors(FileInterceptor('image', multerOptionsForMemory))
  create(
    @Body('name') name: string,
    @Body('description') description: string,
    @Body('price', ParseFloatPipe) price: number,
    @Body('stock', ParseIntPipe) stock: number,
    @Body('image') imageUrl?: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const createProductDto = {
      name,
      description,
      price,
      stock,
      image: imageUrl,
    };
    return this.productsService.create(createProductDto, file);
  }

  // Public - Get all products (with optional search)
  @Get()
  findAll(@Query() searchProductsDto: SearchProductsDto) {
    return this.productsService.findAll(searchProductsDto);
  }

  // Public - Search products
  @Get('search')
  search(
    @Query('query') query: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.productsService.searchProducts(query, page, limit);
  }

  // Public - Get one product
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  // Admin only - Update product with image upload
  @Put(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('ADMIN')
  @UseInterceptors(FileInterceptor('image', multerOptionsForMemory))
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.productsService.update(id, updateProductDto, file);
  }

  // Admin only - Delete product
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
