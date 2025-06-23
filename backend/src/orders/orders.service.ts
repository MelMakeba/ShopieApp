/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger } from '@nestjs/common';
import { ApiResponseService } from '../shared/api-response.services';
import { MailerService } from '../shared/mailer/mailer.service';
import { PrismaClient } from 'generated/prisma';
import { Decimal } from '@prisma/client/runtime/library';

export interface CreateOrderDto {
  userId: string;
  shippingAddress?: string;
  paymentMethod?: string;
}

export interface OrderResponse {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  createdAt: Date;
  items: Array<{
    id: string;
    productName: string;
    quantity: number;
    price: number;
    totalPrice: number;
  }>;
}

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private prisma: PrismaClient,
    private apiResponse: ApiResponseService,
    private mailerService: MailerService,
  ) {}

  async createOrderFromCart(createOrderDto: CreateOrderDto) {
    try {
      const { userId, shippingAddress, paymentMethod } = createOrderDto;

      // Get user details first and validate
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });

      if (!user) {
        return this.apiResponse.notFound('User not found');
      }

      // Get user's cart with items
      const cart = await this.prisma.cart.findFirst({
        where: { userId },
        include: {
          CartItem: {
            // Use lowercase 'cartItem' - check your Prisma schema
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  image: true,
                  stock: true,
                },
              },
            },
          },
        },
      });

      if (!cart || cart.CartItem.length === 0) {
        return this.apiResponse.badRequest('Cart is empty');
      }

      // Check stock availability
      for (const item of cart.CartItem) {
        if (item.product.stock < item.quantity) {
          return this.apiResponse.badRequest(
            `Insufficient stock for ${item.product.name}. Available: ${item.product.stock}, Requested: ${item.quantity}`,
          );
        }
      }

      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create order in a transaction
      const order = await this.prisma.$transaction(async (tx) => {
        // Create the order
        const newOrder = await tx.order.create({
          data: {
            orderNumber,
            userId,
            totalAmount: Number(cart.totalPrice),
            status: 'PENDING',
            shippingAddress,
            paymentMethod: paymentMethod || 'PENDING',
          },
        });

        // Create order items and update product stock
        const orderItems: any[] = [];
        for (const cartItem of cart.CartItem) {
          // Convert price to Decimal and calculate totalPrice
          const price = new Decimal(cartItem.product.price.toString());
          const totalPrice = price.mul(cartItem.quantity);

          // Create order item
          const orderItem = await tx.orderItem.create({
            data: {
              orderId: newOrder.id,
              productId: cartItem.productId,
              quantity: cartItem.quantity,
              price: price.toNumber(), // Convert Decimal to number
              totalPrice: totalPrice.toNumber(), // Convert Decimal to number
            },
            include: {
              product: {
                select: {
                  name: true,
                  image: true,
                },
              },
            },
          });

          // Update product stock
          await tx.product.update({
            where: { id: cartItem.productId },
            data: {
              stock: {
                decrement: cartItem.quantity,
              },
            },
          });

          orderItems.push(orderItem);
        }

        // Clear the cart
        await tx.cartItem.deleteMany({
          where: { cartId: cart.id },
        });

        await tx.cart.update({
          where: { id: cart.id },
          data: { totalPrice: 0 },
        });

        return { order: newOrder, orderItems };
      });

      // Send order confirmation email
      const emailResult = await this.mailerService.sendEmail({
        to: user.email,
        subject: 'ShopieApp - Order Confirmation',
        template: 'order-confirmation',
        context: {
          name: user.name || 'Customer',
          orderNumber,
          orderDate: new Date().toLocaleDateString(),
          items: order.orderItems.map((item) => ({
            name: item.product.name,
            quantity: item.quantity,
            price: Number(item.price),
            image: item.product.image,
          })),
          totalAmount: Number(cart.totalPrice),
          shippingAddress,
        },
      });

      if (!emailResult.success) {
        this.logger.warn(
          `Failed to send order confirmation email: ${emailResult.error || 'Unknown error'}`,
        );
      }

      const response: OrderResponse = {
        id: order.order.id,
        orderNumber,
        totalAmount: Number(cart.totalPrice),
        status: 'PENDING',
        createdAt: order.order.createdAt,
        items: order.orderItems.map((item) => ({
          id: item.id,
          productName: item.product.name,
          quantity: item.quantity,
          price: Number(item.price),
          totalPrice: Number(item.totalPrice),
        })),
      };

      return this.apiResponse.created(
        response,
        'Order created successfully and confirmation email sent',
      );
    } catch (error) {
      this.logger.error(
        `Failed to create order: ${error instanceof Error ? error.message : String(error)}`,
      );
      return this.apiResponse.error(
        'Failed to create order',
        500,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  async getUserOrders(userId: string) {
    try {
      const orders = await this.prisma.order.findMany({
        where: { userId },
        include: {
          OrderItem: {
            include: {
              product: {
                select: {
                  name: true,
                  image: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const response = orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        totalAmount: Number(order.totalAmount),
        status: order.status,
        createdAt: order.createdAt,
        shippingAddress: order.shippingAddress,
        items: order.OrderItem.map((item) => ({
          id: item.id,
          productName: item.product.name,
          quantity: item.quantity,
          price: Number(item.price),
          totalPrice: Number(item.totalPrice),
          image: item.product.image,
        })),
      }));

      return this.apiResponse.ok(
        response,
        'Orders retrieved successfully',
        '/orders',
        { count: response.length },
      );
    } catch (error) {
      this.logger.error(
        `Failed to get user orders: ${error instanceof Error ? error.message : String(error)}`,
      );
      return this.apiResponse.error(
        'Failed to retrieve orders',
        500,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  async getOrderById(orderId: string, userId: string) {
    try {
      const order = await this.prisma.order.findFirst({
        where: {
          id: orderId,
          userId,
        },
        include: {
          OrderItem: {
            include: {
              product: {
                select: {
                  name: true,
                  image: true,
                },
              },
            },
          },
        },
      });

      if (!order) {
        return this.apiResponse.notFound('Order not found');
      }

      const response: OrderResponse = {
        id: order.id,
        orderNumber: order.orderNumber,
        totalAmount: Number(order.totalAmount),
        status: order.status,
        createdAt: order.createdAt,
        items: order.OrderItem.map((item) => ({
          id: item.id,
          productName: item.product.name,
          quantity: item.quantity,
          price: Number(item.price),
          totalPrice: Number(item.totalPrice),
        })),
      };

      return this.apiResponse.ok(
        response,
        'Order retrieved successfully',
        `/orders/${orderId}`,
        response,
      );
    } catch (error) {
      this.logger.error(
        `Failed to get order: ${error instanceof Error ? error.message : String(error)}`,
      );
      return this.apiResponse.error(
        'Failed to retrieve order',
        500,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  async updateOrderStatus(orderId: string, status: string) {
    try {
      const order = await this.prisma.order.update({
        where: { id: orderId },
        data: { status },
        include: {
          user: {
            select: { email: true, name: true },
          },
        },
      });

      // Send email notification for status updates
      if (status === 'SHIPPED' || status === 'DELIVERED') {
        this.logger.log(
          `Order ${order.orderNumber} status updated to ${status}`,
        );
      }

      const response = { orderId, status };

      return this.apiResponse.ok(
        response,
        `Order status updated to ${status}`,
        `/orders/${orderId}`,
        response,
      );
    } catch (error) {
      this.logger.error(
        `Failed to update order status: ${error instanceof Error ? error.message : String(error)}`,
      );
      return this.apiResponse.error(
        'Failed to update order status',
        500,
        error instanceof Error ? error.message : String(error),
      );
    }
  }
}
