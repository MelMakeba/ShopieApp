import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { OrdersService, CreateOrderDto } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-guard/jwt-guard.guard';
import { RoleGuard } from '../auth/guards/role-guard/role-guard.guard';
import { Roles } from '../auth/decorators/role.decorator';

// Define the authenticated request interface
interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
    email: string;
    role?: string;
  };
}

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('create')
  async createOrder(
    @Request() req: AuthenticatedRequest,
    @Body() createOrderDto: Partial<CreateOrderDto>,
  ) {
    const userId = req.user.sub;
    return this.ordersService.createOrderFromCart({
      userId,
      ...createOrderDto,
    } as CreateOrderDto);
  }

  @Get('my-orders')
  async getMyOrders(@Request() req: AuthenticatedRequest) {
    const userId = req.user.sub;
    return this.ordersService.getUserOrders(userId);
  }

  @Get(':id')
  async getOrder(
    @Param('id') orderId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const userId = req.user.sub;
    return this.ordersService.getOrderById(orderId, userId);
  }

  @Patch(':id/status')
  @UseGuards(RoleGuard)
  @Roles('ADMIN')
  async updateOrderStatus(
    @Param('id') orderId: string,
    @Body('status') status: string,
  ) {
    return this.ordersService.updateOrderStatus(orderId, status);
  }
}
