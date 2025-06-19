import {
  IsOptional,
  IsNumber,
  IsString,
  IsUrl,
  Min,
  MaxLength,
} from 'class-validator';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Product name cannot exceed 100 characters' })
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Description cannot exceed 500 characters' })
  description?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Price must be a number' })
  @Min(0, { message: 'Price cannot be negative' })
  price?: number;

  @IsOptional()
  @IsUrl({}, { message: 'Invalid image URL format' })
  imageUrl?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Stock must be a number' })
  @Min(0, { message: 'Stock cannot be negative' })
  stock?: number;
  image: any;
}
