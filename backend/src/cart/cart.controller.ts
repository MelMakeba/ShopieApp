import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../auth/guards/jwt-guard/jwt-guard.guard';
import { AddToCartDto } from './dtos/add-to-cart.dto';
import { UpdateCartItemDto } from './dtos/update-cart.dto';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: {
    id: string;
    [key: string]: any;
  };
}

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@Req() req: RequestWithUser) {
    return this.cartService.getCart(req.user.id);
  }

  @Post('items')
  addToCart(@Req() req: RequestWithUser, @Body() addToCartDto: AddToCartDto) {
    return this.cartService.addToCart(req.user.id, addToCartDto);
  }

  @Put('items/:id')
  updateCartItem(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ) {
    return this.cartService.updateCartItem(req.user.id, id, updateCartItemDto);
  }

  @Delete('items/:id')
  removeFromCart(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.cartService.removeFromCart(req.user.id, id);
  }

  @Delete()
  clearCart(@Req() req: RequestWithUser) {
    return this.cartService.clearCart(req.user.id);
  }
}
