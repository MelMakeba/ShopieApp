import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUrl,
  Min,
  MaxLength,
  IsOptional,
} from 'class-validator';

export class CreateProductDto {
  @IsNotEmpty({ message: 'Product name is required' })
  @IsString()
  @MaxLength(100, { message: 'Product name cannot exceed 100 characters' })
  name: string;

  @IsNotEmpty({ message: 'Product description is required' })
  @IsString()
  @MaxLength(500, { message: 'Description cannot exceed 500 characters' })
  description: string;

  @IsNotEmpty({ message: 'Product price is required' })
  @IsNumber({}, { message: 'Price must be a number' })
  @Min(0, { message: 'Price cannot be negative' })
  price: number;

  @IsOptional()
  @IsUrl({}, { message: 'Invalid image URL format' })
  image?: string;

  @IsNotEmpty({ message: 'Stock quantity is required' })
  @IsNumber({}, { message: 'Stock must be a number' })
  @Min(0, { message: 'Stock cannot be negative' })
  stock: number;
}
