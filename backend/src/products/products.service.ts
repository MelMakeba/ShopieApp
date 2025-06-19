/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { PrismaClient } from 'generated/prisma';
import { ApiResponseService } from '../shared/api-response.services';
import {
  CloudinaryService,
  ShopieUploadType,
} from '../shared/cloudinary/cloudinary.service';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';
import { SearchProductsDto } from './dtos/search-product.dto';
import { ApiResponse } from '../shared/interfaces/api-response.interfaces';
import { Product } from './interfaces/product.interfaces';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaClient,
    private apiResponse: ApiResponseService,
    private cloudinaryService: CloudinaryService,
  ) {}

  async create(createProductDto: CreateProductDto, file?: Express.Multer.File) {
    try {
      // Ensure createProductDto.image has a type
      let productImage: string | undefined = createProductDto.image;

      // If file is provided, upload it to Cloudinary
      if (file) {
        const uploadResult = await this.cloudinaryService.uploadFile(
          file,
          ShopieUploadType.PRODUCT_IMAGE,
        );
        if (!uploadResult || !uploadResult.secure_url) {
          return this.apiResponse.error('Failed to upload product image', 500);
        }
        productImage = uploadResult.secure_url;
      }

      // If no image is provided (neither URL nor file)
      if (!productImage) {
        return this.apiResponse.badRequest('Product image is required');
      }

      const product = await this.prisma.product.create({
        data: {
          ...createProductDto,
          image: productImage,
        },
      });

      return this.apiResponse.created(product, 'Product created successfully');
    } catch (error: unknown) {
      return this.apiResponse.error(
        'Failed to create product',
        500,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  async findAll(
    params: SearchProductsDto = {},
  ): Promise<ApiResponse<Product[]>> {
    try {
      const { page = 1, limit = 10, query } = params;
      const skip = (page - 1) * limit;

      let whereClause = {};
      if (query) {
        whereClause = {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        };
      }

      const [dbProducts, total] = await Promise.all([
        this.prisma.product.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.product.count({ where: whereClause }),
      ]);

      // Transform products to ensure description is never null
      const products = dbProducts.map((p) => ({
        ...p,
        description: p.description || '', // Convert null to empty string
      }));

      const totalPages = Math.ceil(total / limit);

      return this.apiResponse.paginate(
        products,
        { page, limit, total, totalPages },
        'Products retrieved successfully',
      );
    } catch (error: unknown) {
      return this.apiResponse.error(
        'Failed to retrieve products',
        500,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  async findOne(id: string) {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id },
      });

      if (!product) {
        return this.apiResponse.notFound(`Product with ID ${id} not found`);
      }

      return this.apiResponse.ok(
        product,
        'Product retrieved successfully',
        '', // redirectUrl (empty if not needed)
        product, // data
      );
    } catch (error: unknown) {
      return this.apiResponse.error(
        'Failed to retrieve product',
        500,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    file?: Express.Multer.File,
  ) {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id },
      });

      if (!product) {
        return this.apiResponse.notFound(`Product with ID ${id} not found`);
      }

      let newImage = updateProductDto.image;

      // If file is provided, upload it to Cloudinary
      if (file) {
        const uploadResult = await this.cloudinaryService.uploadFile(
          file,
          ShopieUploadType.PRODUCT_IMAGE,
          {
            entityId: id,
            entityType: 'product',
          },
        );
        if (!uploadResult || !uploadResult.secure_url) {
          return this.apiResponse.error('Failed to upload product image', 500);
        }
        newImage = uploadResult.secure_url;

        // If the product already had an image, delete the old one
        if (product.image && product.image.includes('cloudinary')) {
          // Extract public ID and delete old image
          const publicId = this.cloudinaryService.extractPublicIdFromUrl(
            product.image,
          );
          if (publicId) {
            await this.cloudinaryService.deleteFile(publicId);
          }
        }
      }

      const updatedProduct = await this.prisma.product.update({
        where: { id },
        data: {
          ...updateProductDto,
          ...(newImage && { image: newImage }),
        },
      });

      return this.apiResponse.ok(
        updatedProduct,
        'Product updated successfully',
        '', // redirectUrl (empty string if not needed)
        updatedProduct, // data
      );
    } catch (error: unknown) {
      return this.apiResponse.error(
        'Failed to update product',
        500,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  async remove(id: string) {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id },
      });

      if (!product) {
        return this.apiResponse.notFound(`Product with ID ${id} not found`);
      }

      // Delete image from Cloudinary if it exists
      if (product.image && product.image.includes('cloudinary')) {
        const publicId = this.cloudinaryService.extractPublicIdFromUrl(
          product.image,
        );
        if (publicId) {
          await this.cloudinaryService.deleteFile(publicId);
        }
      }

      await this.prisma.product.delete({ where: { id } });

      return this.apiResponse.ok(
        null,
        'Product deleted successfully',
        '', // redirectUrl
        null, // data
      );
    } catch (error: unknown) {
      return this.apiResponse.error(
        'Failed to delete product',
        500,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  async searchProducts(
    query: string,
    page = 1,
    limit = 10,
  ): Promise<ApiResponse<Product[]>> {
    return this.findAll({ query, page, limit });
  }
}
