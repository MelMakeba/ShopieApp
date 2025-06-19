import { IsNotEmpty, IsNumber, Min } from 'class-validator';

export class UpdateCartItemDto {
  @IsNotEmpty({ message: 'Quantity is required' })
  @IsNumber({}, { message: 'Quantity must be a number' })
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity: number;
}
