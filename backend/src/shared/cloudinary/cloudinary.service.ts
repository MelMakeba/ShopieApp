/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable no-useless-escape */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import * as streamifier from 'streamifier';

/**
 * Result interface for Cloudinary uploads
 * Contains all essential information returned after successful upload
 */
export interface CloudinaryUploadResult {
  public_id: string; // Unique identifier for the uploaded file
  secure_url: string; // HTTPS URL to access the file
  url: string; // HTTP URL to access the file
  original_filename: string; // Original name of the uploaded file
  bytes: number; // File size in bytes
  format: string; // File format (jpg, png, pdf, etc.)
  resource_type: string; // Type of resource (image, video, raw)
  created_at: string; // Upload timestamp
  width?: number; // Image width (for images only)
  height?: number; // Image height (for images only)
  folder: string; // Cloudinary folder path
}

/**
 * Configuration for different upload types in e-commerce system
 */
export interface ShopieUploadConfig {
  uploadType: ShopieUploadType;
  maxSizeBytes: number; // Maximum file size allowed
  allowedFormats: string[]; // Allowed file extensions
  folder: string; // Cloudinary folder structure
  transformations?: any; // Image transformation options
}

/**
 * Enum defining all upload types used in Shopie e-commerce system
 */
export enum ShopieUploadType {
  PRODUCT_IMAGE = 'product_image', // Main product images
  PRODUCT_THUMBNAIL = 'product_thumbnail', // Product thumbnail images
  CATEGORY_IMAGE = 'category_image', // Category images
  USER_PROFILE = 'user_profile', // User profile pictures
  BANNER = 'banner', // Banner advertisements
  LOGO = 'logo', // Store logo
  ORDER_RECEIPT = 'order_receipt', // Order receipts and invoices
  RETURN_DOCUMENT = 'return_document', // Return-related documents
}

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private configService: ConfigService) {
    // Initialize Cloudinary with environment variables
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_SECRET_KEY,
    });

    this.logger.log('Cloudinary service initialized successfully');
  }

  /**
   * Get upload configuration based on upload type
   * Each type has specific size limits, allowed formats, and folder structure
   */
  private getUploadConfig(uploadType: ShopieUploadType): ShopieUploadConfig {
    const configs: Record<ShopieUploadType, ShopieUploadConfig> = {
      [ShopieUploadType.PRODUCT_IMAGE]: {
        uploadType,
        maxSizeBytes: 5 * 1024 * 1024, // 5MB
        allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
        folder: 'shopie/products/images',
        transformations: {
          width: 800,
          height: 800,
          crop: 'fill',
          quality: 'auto',
          format: 'auto',
        },
      },
      [ShopieUploadType.PRODUCT_THUMBNAIL]: {
        uploadType,
        maxSizeBytes: 2 * 1024 * 1024, // 2MB
        allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
        folder: 'shopie/products/thumbnails',
        transformations: {
          width: 300,
          height: 300,
          crop: 'fill',
          quality: 'auto',
          format: 'auto',
        },
      },
      [ShopieUploadType.CATEGORY_IMAGE]: {
        uploadType,
        maxSizeBytes: 3 * 1024 * 1024, // 3MB
        allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
        folder: 'shopie/categories',
        transformations: {
          width: 600,
          height: 400,
          crop: 'fill',
          quality: 'auto',
          format: 'auto',
        },
      },
      [ShopieUploadType.USER_PROFILE]: {
        uploadType,
        maxSizeBytes: 2 * 1024 * 1024, // 2MB
        allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
        folder: 'shopie/users/profiles',
        transformations: {
          width: 400,
          height: 400,
          crop: 'fill',
          gravity: 'face',
          quality: 'auto',
          format: 'auto',
        },
      },
      [ShopieUploadType.BANNER]: {
        uploadType,
        maxSizeBytes: 5 * 1024 * 1024, // 5MB
        allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
        folder: 'shopie/marketing/banners',
        transformations: {
          width: 1200,
          height: 400,
          crop: 'fill',
          quality: 'auto',
          format: 'auto',
        },
      },
      [ShopieUploadType.LOGO]: {
        uploadType,
        maxSizeBytes: 1 * 1024 * 1024, // 1MB
        allowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'svg'],
        folder: 'shopie/branding/logos',
        transformations: {
          width: 400,
          height: 400,
          crop: 'fit',
          quality: 'auto',
          format: 'auto',
        },
      },
      [ShopieUploadType.ORDER_RECEIPT]: {
        uploadType,
        maxSizeBytes: 5 * 1024 * 1024, // 5MB
        allowedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
        folder: 'shopie/orders/receipts',
      },
      [ShopieUploadType.RETURN_DOCUMENT]: {
        uploadType,
        maxSizeBytes: 5 * 1024 * 1024, // 5MB
        allowedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
        folder: 'shopie/orders/returns',
      },
    };

    return configs[uploadType];
  }

  /**
   * Validate uploaded file against configuration rules
   * Checks file size, format, and MIME type
   */
  private validateFile(
    file: Express.Multer.File,
    config: ShopieUploadConfig,
  ): void {
    // Check if file exists
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Check file size
    if (file.size > config.maxSizeBytes) {
      const maxSizeMB = (config.maxSizeBytes / (1024 * 1024)).toFixed(1);
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${maxSizeMB}MB for ${config.uploadType}`,
      );
    }

    // Check file extension
    const fileExtension = file.originalname?.split('.').pop()?.toLowerCase();
    if (!fileExtension || !config.allowedFormats.includes(fileExtension)) {
      throw new BadRequestException(
        `Invalid file format. Allowed formats for ${config.uploadType}: ${config.allowedFormats.join(', ')}`,
      );
    }

    // Check MIME type
    const allowedMimeTypes = this.getMimeTypesForFormats(config.allowedFormats);
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid MIME type. Expected one of: ${allowedMimeTypes.join(', ')}`,
      );
    }

    this.logger.debug(
      `File validation passed for ${config.uploadType}: ${file.originalname}`,
    );
  }

  /**
   * Map file extensions to their corresponding MIME types
   * Used for additional validation security
   */
  private getMimeTypesForFormats(formats: string[]): string[] {
    const mimeTypeMap: Record<string, string[]> = {
      jpg: ['image/jpeg'],
      jpeg: ['image/jpeg'],
      png: ['image/png'],
      webp: ['image/webp'],
      svg: ['image/svg+xml'],
      pdf: ['application/pdf'],
    };

    return formats.flatMap((format) => mimeTypeMap[format] || []);
  }

  /**
   * Generate unique public ID for uploaded files
   * Format: folder/entityType/entityId/uploadType_timestamp_random
   */
  private generatePublicId(
    config: ShopieUploadConfig,
    entityId?: string | number,
    entityType?: string,
  ): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);

    if (entityId && entityType) {
      return `${config.folder}/${entityType}/${entityId}/${config.uploadType}_${timestamp}_${randomString}`;
    }

    return `${config.folder}/${config.uploadType}_${timestamp}_${randomString}`;
  }

  /**
   * Upload single file to Cloudinary
   * Main upload method used by all other upload functions
   */
  async uploadFile(
    file: Express.Multer.File,
    uploadType: ShopieUploadType,
    options?: {
      entityId?: string | number;
      entityType?: string;
      tags?: string[];
      context?: Record<string, any>;
    },
  ): Promise<CloudinaryUploadResult> {
    try {
      const config = this.getUploadConfig(uploadType);

      // Validate file
      this.validateFile(file, config);

      // Generate unique public ID
      const publicId = this.generatePublicId(
        config,
        options?.entityId,
        options?.entityType,
      );

      this.logger.log(`Uploading ${uploadType} file: ${file.originalname}`);

      // Prepare upload options
      const uploadOptions: any = {
        public_id: publicId,
        resource_type: 'auto',
        tags: [
          uploadType,
          ...(options?.tags || []),
          ...(options?.entityType ? [options.entityType] : []),
          ...(options?.entityId
            ? [`${options.entityType}-${options.entityId}`]
            : []),
        ].filter(Boolean),
        context: {
          upload_type: uploadType,
          uploaded_at: new Date().toISOString(),
          ...(options?.context || {}),
        },
      };

      // Add transformations for images
      if (config.transformations) {
        uploadOptions.transformation = config.transformations;
      }

      // Upload to Cloudinary
      const result = await new Promise<CloudinaryUploadResult>(
        (resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            uploadOptions,
            (error: any, result: any) => {
              if (error) {
                this.logger.error(`Cloudinary upload failed: ${error.message}`);
                reject(
                  new BadRequestException(`Upload failed: ${error.message}`),
                );
              } else if (result) {
                resolve({
                  public_id: result.public_id,
                  secure_url: result.secure_url,
                  url: result.url,
                  original_filename: result.original_filename,
                  bytes: result.bytes,
                  format: result.format,
                  resource_type: result.resource_type,
                  created_at: result.created_at,
                  width: result.width,
                  height: result.height,
                  folder: result.folder,
                });
              } else {
                reject(
                  new BadRequestException('Upload failed: No result returned'),
                );
              }
            },
          );

          uploadStream.write(file.buffer);
          uploadStream.end();
        },
      );

      this.logger.log(
        `Successfully uploaded ${uploadType} with public_id: ${result.public_id}`,
      );
      return result;
    } catch (error: any) {
      this.logger.error(
        `File upload failed: ${error?.message || 'Unknown error'}`,
      );
      throw error;
    }
  }

  /**
   * Upload multiple files at once
   * Used for bulk uploads like product image galleries
   */
  async uploadMultipleFiles(
    files: Express.Multer.File[],
    uploadType: ShopieUploadType,
    options?: {
      entityId?: string | number;
      entityType?: string;
      tags?: string[];
      context?: Record<string, any>;
    },
  ): Promise<CloudinaryUploadResult[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    this.logger.log(`Uploading ${files.length} files of type ${uploadType}`);

    try {
      const uploadPromises = files.map((file, index) =>
        this.uploadFile(file, uploadType, {
          ...options,
          tags: [...(options?.tags || []), `batch-${Date.now()}-${index}`],
        }),
      );

      const results = await Promise.all(uploadPromises);
      this.logger.log(`Successfully uploaded ${results.length} files`);
      return results;
    } catch (error: any) {
      this.logger.error(
        `Batch upload failed: ${error?.message || 'Unknown error'}`,
      );
      throw new BadRequestException('One or more file uploads failed');
    }
  }

  /**
   * Upload product image with automatic transformations
   */
  async uploadProductImage(
    file: Express.Multer.File,
    productId: string,
    oldImageUrl?: string,
  ): Promise<CloudinaryUploadResult> {
    try {
      // Delete old product image if exists
      if (oldImageUrl) {
        const oldPublicId = this.extractPublicIdFromUrl(oldImageUrl);
        await this.deleteFile(oldPublicId).catch((error) => {
          this.logger.warn(
            `Failed to delete old product image: ${error.message}`,
          );
        });
      }

      return await this.uploadFile(file, ShopieUploadType.PRODUCT_IMAGE, {
        entityId: productId,
        entityType: 'product',
        tags: ['product', 'image'],
        context: { product_id: productId },
      });
    } catch (error) {
      this.logger.error(
        `Product image upload failed for product ${productId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Upload user profile image with automatic old image cleanup
   */
  async uploadUserProfileImage(
    file: Express.Multer.File,
    userId: string,
    oldImageUrl?: string,
  ): Promise<CloudinaryUploadResult> {
    try {
      // Delete old profile image if exists
      if (oldImageUrl) {
        const oldPublicId = this.extractPublicIdFromUrl(oldImageUrl);
        await this.deleteFile(oldPublicId).catch((error) => {
          this.logger.warn(
            `Failed to delete old profile image: ${error.message}`,
          );
        });
      }

      return await this.uploadFile(file, ShopieUploadType.USER_PROFILE, {
        entityId: userId,
        entityType: 'user',
        tags: ['profile', 'user'],
        context: { user_id: userId },
      });
    } catch (error) {
      this.logger.error(
        `Profile image upload failed for user ${userId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Upload category image
   */
  async uploadCategoryImage(
    file: Express.Multer.File,
    categoryId: string,
    oldImageUrl?: string,
  ): Promise<CloudinaryUploadResult> {
    try {
      // Delete old category image if exists
      if (oldImageUrl) {
        const oldPublicId = this.extractPublicIdFromUrl(oldImageUrl);
        await this.deleteFile(oldPublicId).catch((error) => {
          this.logger.warn(
            `Failed to delete old category image: ${error.message}`,
          );
        });
      }

      return await this.uploadFile(file, ShopieUploadType.CATEGORY_IMAGE, {
        entityId: categoryId,
        entityType: 'category',
        tags: ['category', 'image'],
        context: { category_id: categoryId },
      });
    } catch (error) {
      this.logger.error(
        `Category image upload failed for category ${categoryId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Delete file from Cloudinary
   */
  async deleteFile(publicId: string): Promise<void> {
    try {
      this.logger.log(`Deleting file with public_id: ${publicId}`);

      const result: any = await cloudinary.uploader.destroy(publicId);

      if (result.result !== 'ok' && result.result !== 'not found') {
        throw new BadRequestException(
          `Failed to delete file: ${result.result}`,
        );
      }

      this.logger.log(`Successfully deleted file: ${publicId}`);
    } catch (error: any) {
      this.logger.error(
        `File deletion failed: ${error?.message || 'Unknown error'}`,
      );
      throw error;
    }
  }

  /**
   * Delete multiple files at once
   */
  async deleteMultipleFiles(publicIds: string[]): Promise<void> {
    if (!publicIds || publicIds.length === 0) {
      return;
    }

    try {
      this.logger.log(`Deleting ${publicIds.length} files`);

      const result: any = await cloudinary.api.delete_resources(publicIds);
      this.logger.log(`Bulk deletion result: ${JSON.stringify(result)}`);
    } catch (error: any) {
      this.logger.error(
        `Bulk deletion failed: ${error?.message || 'Unknown error'}`,
      );
      throw new BadRequestException('Failed to delete multiple files');
    }
  }

  /**
   * Generate signed URL for secure file access
   */
  generateSignedUrl(publicId: string, expirationMinutes: number = 60): string {
    const timestamp = Math.round(Date.now() / 1000) + expirationMinutes * 60;

    return cloudinary.utils.private_download_url(publicId, 'auto', {
      resource_type: 'auto',
      expires_at: timestamp,
    });
  }

  /**
   * Get optimized URL with transformations
   */
  getOptimizedUrl(
    publicId: string,
    transformations?: {
      width?: number;
      height?: number;
      crop?: string;
      quality?: string;
      format?: string;
    },
  ): string {
    return cloudinary.url(publicId, {
      quality: 'auto',
      fetch_format: 'auto',
      ...transformations,
    });
  }

  /**
   * Get thumbnail URL for images
   */
  getThumbnailUrl(
    publicId: string,
    width: number = 300,
    height: number = 300,
  ): string {
    return cloudinary.url(publicId, {
      width,
      height,
      crop: 'fill',
      quality: 'auto',
      format: 'auto',
    });
  }

  /**
   * Extract public_id from Cloudinary URL
   * Used for cleanup operations
   */
  extractPublicIdFromUrl(url: string): string {
    try {
      if (!url || !url.includes('cloudinary.com')) {
        return '';
      }

      // Extract public_id from Cloudinary URL
      const matches = url.match(/\/([^\/]+)\.[^\/]+$/);
      if (matches && matches[1]) {
        return matches[1];
      }

      // Alternative method for complex URLs
      const parts = url.split('/');
      const fileWithExtension = parts[parts.length - 1];
      const publicId = fileWithExtension.split('.')[0];

      // Reconstruct full public_id with folder path if needed
      const shopieIndex = parts.indexOf('shopie');
      if (shopieIndex !== -1) {
        const folderParts = parts.slice(shopieIndex);
        folderParts[folderParts.length - 1] = publicId;
        return folderParts.join('/');
      }

      return publicId;
    } catch {
      this.logger.warn(`Failed to extract public_id from URL: ${url}`);
      return '';
    }
  }

  /**
   * Get files by tags (useful for fetching related images)
   */
  async getFilesByTag(tag: string, maxResults: number = 50): Promise<any[]> {
    try {
      const result = await cloudinary.api.resources_by_tag(tag, {
        max_results: maxResults,
        resource_type: 'auto',
      });

      return result.resources || [];
    } catch (error: any) {
      this.logger.error(
        `Failed to get files by tag ${tag}: ${error?.message || 'Unknown error'}`,
      );
      throw new BadRequestException(`Failed to fetch files with tag: ${tag}`);
    }
  }

  /**
   * Search for product images by product ID
   */
  async getProductImages(productId: string): Promise<any[]> {
    try {
      return await this.searchFilesByContext('product_id', productId);
    } catch (error) {
      this.logger.error(`Failed to get product images: ${error.message}`);
      throw error;
    }
  }

  /**
   * Search files by context (useful for finding product or entity-specific files)
   */
  async searchFilesByContext(
    contextKey: string,
    contextValue: string,
    maxResults: number = 50,
  ): Promise<any[]> {
    try {
      const result = await cloudinary.search
        .expression(`context.${contextKey}=${contextValue}`)
        .max_results(maxResults)
        .execute();

      return result.resources || [];
    } catch (error: any) {
      this.logger.error(
        `Failed to search files by context ${contextKey}=${contextValue}: ${error?.message || 'Unknown error'}`,
      );
      throw new BadRequestException('Search failed');
    }
  }

  /**
   * Uploads an image file to Cloudinary
   * @param file The image file to upload
   * @returns The Cloudinary image URL or null if upload failed
   */
  async uploadImage(file: Express.Multer.File): Promise<string | null> {
    try {
      return new Promise<string>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'shopie-app',
          },
          (error: any, result: any) => {
            if (error) {
              // Create a proper Error object with a meaningful message
              if (error instanceof Error) {
                return reject(error);
              } else if (typeof error === 'string') {
                return reject(new Error(error));
              } else {
                try {
                  // Try to get a meaningful error message from the object
                  const errorMessage =
                    error.message ||
                    error.error?.message ||
                    JSON.stringify(error);
                  return reject(new Error(errorMessage));
                } catch (_) {
                  // Fallback if JSON stringify fails
                  // Using underscore to indicate intentionally unused parameter
                  return reject(new Error('Unknown upload error'));
                }
              }
            }

            // Check if result exists and has secure_url property
            if (result && result.secure_url) {
              resolve(result.secure_url);
            } else {
              reject(new Error('Invalid response from Cloudinary'));
            }
          },
        );

        streamifier.createReadStream(file.buffer).pipe(uploadStream);
      });
    } catch (error) {
      this.logger.error('Error uploading to Cloudinary:', error);
      return null;
    }
  }

  /**
   * Extracts the public ID from a Cloudinary URL
   * @param url The Cloudinary URL
   * @returns The public ID
   */
  extractPublicId(url: string): string {
    const splitUrl = url.split('/');
    const publicIdWithExtension = splitUrl[splitUrl.length - 1];
    // Remove file extension
    return publicIdWithExtension.split('.')[0];
  }

  /**
   * Deletes an image from Cloudinary by public ID
   * @param publicId The public ID of the image
   */
  async deleteImage(publicId: string): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === 'ok';
    } catch (error) {
      console.error('Error deleting from Cloudinary:', error);
      return false;
    }
  }
}
