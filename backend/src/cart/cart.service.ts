import { Injectable } from '@nestjs/common';
import { PrismaClient } from 'generated/prisma';
import { ApiResponseService } from '../shared/api-response.services';
import { AddToCartDto } from './dtos/add-to-cart.dto';
import { UpdateCartItemDto } from './dtos/update-cart.dto';

@Injectable()
export class CartService {
  constructor(
    private prisma: PrismaClient,
    private apiResponse: ApiResponseService,
  ) {}

  async getCart(userId: string) {
    try {
      // Get or create cart for user
      let cart = await this.prisma.cart.findFirst({
        where: { userId },
        include: {
          CartItem: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  price: true,
                  image: true,
                },
              },
            },
          },
        },
      });

      if (!cart) {
        cart = await this.prisma.cart.create({
          data: {
            userId,
            totalPrice: 0,
          },
          include: {
            CartItem: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                    price: true,
                    image: true,
                  },
                },
              },
            },
          },
        });
      }

      return this.apiResponse.ok(
        cart,
        'Cart retrieved successfully',
        '', // redirectUrl (empty if not needed)
        cart, // data
      );
    } catch (error) {
      return this.apiResponse.error(
        'Failed to retrieve cart',
        500,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  async addToCart(userId: string, addToCartDto: AddToCartDto) {
    try {
      const { productId, quantity } = addToCartDto;

      // Check if product exists and has enough stock
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        return this.apiResponse.notFound(
          `Product with ID ${productId} not found`,
        );
      }

      if (product.stock < quantity) {
        return this.apiResponse.badRequest(
          `Not enough stock. Only ${product.stock} available.`,
        );
      }

      // Get or create cart
      let cart = await this.prisma.cart.findFirst({
        where: { userId },
      });

      if (!cart) {
        cart = await this.prisma.cart.create({
          data: {
            userId,
            totalPrice: 0,
          },
        });
      }

      // Check if item already exists in cart
      const existingCartItem = await this.prisma.cartItem.findFirst({
        where: {
          cartId: cart.id,
          productId,
        },
      });

      let cartItem;

      if (existingCartItem) {
        // Update existing cart item
        const newQuantity = existingCartItem.quantity + quantity;

        // Check if new quantity exceeds available stock
        if (newQuantity > product.stock) {
          return this.apiResponse.badRequest(
            `Cannot add ${quantity} more units. Only ${product.stock} available in total.`,
          );
        }

        cartItem = await this.prisma.cartItem.update({
          where: { id: existingCartItem.id },
          data: {
            quantity: newQuantity,
            price: product.price * newQuantity,
          },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                description: true,
                price: true,
                image: true,
              },
            },
          },
        });
      } else {
        // Create new cart item
        cartItem = await this.prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId,
            quantity,
            price: product.price * quantity,
          },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                description: true,
                price: true,
                image: true,
              },
            },
          },
        });
      }

      // Update product stock
      await this.prisma.product.update({
        where: { id: productId },
        data: {
          stock: product.stock - quantity,
        },
      });

      // Update cart total price
      const cartItems = await this.prisma.cartItem.findMany({
        where: { cartId: cart.id },
        include: { product: true },
      });

      const totalPrice = cartItems.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0,
      );

      await this.prisma.cart.update({
        where: { id: cart.id },
        data: { totalPrice },
      });

      return this.apiResponse.ok(
        cartItem,
        'Product added to cart successfully',
        '', // redirectUrl
        cartItem, // data
      );
    } catch (error) {
      return this.apiResponse.error(
        'Failed to add product to cart',
        500,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  async updateCartItem(
    userId: string,
    itemId: string,
    updateCartItemDto: UpdateCartItemDto,
  ) {
    try {
      // Find the cart item and verify it belongs to the user
      const cartItem = await this.prisma.cartItem.findFirst({
        where: {
          id: itemId,
          cart: {
            userId,
          },
        },
        include: {
          product: true,
        },
      });

      if (!cartItem) {
        return this.apiResponse.notFound(
          `Cart item with ID ${itemId} not found`,
        );
      }

      const { quantity } = updateCartItemDto;
      const product = cartItem.product;
      const quantityDifference = quantity - cartItem.quantity;

      // Check if we have enough stock for the requested quantity
      if (product.stock < quantityDifference) {
        return this.apiResponse.badRequest(
          `Cannot increase quantity by ${quantityDifference}. Only ${product.stock} more available.`,
        );
      }

      // Update cart item
      const updatedCartItem = await this.prisma.cartItem.update({
        where: { id: itemId },
        data: {
          quantity,
          price: product.price * quantity,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              image: true,
            },
          },
        },
      });

      // Update product stock
      await this.prisma.product.update({
        where: { id: product.id },
        data: {
          stock: product.stock - quantityDifference,
        },
      });

      // Update cart total price
      const cart = await this.prisma.cart.findUnique({
        where: { id: cartItem.cartId },
        include: {
          CartItem: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!cart) {
        return this.apiResponse.notFound(
          `Cart with ID ${cartItem.cartId} not found`,
        );
      }

      const totalPrice = cart.CartItem.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0,
      );

      await this.prisma.cart.update({
        where: { id: cart.id },
        data: { totalPrice },
      });

      return this.apiResponse.ok(
        updatedCartItem,
        'Cart item updated successfully',
        '', // redirectUrl
        updatedCartItem, // data
      );
    } catch (error) {
      return this.apiResponse.error(
        'Failed to update cart item',
        500,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  async removeFromCart(userId: string, itemId: string) {
    try {
      // Find the cart item and verify it belongs to the user
      const cartItem = await this.prisma.cartItem.findFirst({
        where: {
          id: itemId,
          cart: {
            userId,
          },
        },
      });

      if (!cartItem) {
        return this.apiResponse.notFound(
          `Cart item with ID ${itemId} not found`,
        );
      }

      // Return item quantity to product stock
      await this.prisma.product.update({
        where: { id: cartItem.productId },
        data: {
          stock: {
            increment: cartItem.quantity,
          },
        },
      });

      // Delete cart item
      await this.prisma.cartItem.delete({
        where: { id: itemId },
      });

      // Update cart total price
      const cart = await this.prisma.cart.findUnique({
        where: { id: cartItem.cartId },
        include: {
          CartItem: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!cart) {
        return this.apiResponse.notFound(
          `Cart with ID ${cartItem.cartId} not found`,
        );
      }

      const totalPrice = cart.CartItem.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0,
      );

      await this.prisma.cart.update({
        where: { id: cart.id },
        data: { totalPrice },
      });

      return this.apiResponse.ok(
        null,
        'Product removed from cart successfully',
        '', // redirectUrl
        null, // data
      );
    } catch (error) {
      return this.apiResponse.error(
        'Failed to remove product from cart',
        500,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  async clearCart(userId: string) {
    try {
      // Get cart
      const cart = await this.prisma.cart.findFirst({
        where: { userId },
        include: {
          CartItem: {
            include: {
              // Add this nested include for product
              product: true,
            },
          },
        },
      });

      if (!cart || cart.CartItem.length === 0) {
        return this.apiResponse.ok(
          null,
          'Cart is already empty',
          '', // redirectUrl
          null, // data
        );
      }

      // Now TypeScript knows cart isn't null beyond this point

      // Return quantities to product stock
      for (const item of cart.CartItem) {
        await this.prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });
      }

      // Delete all cart items
      await this.prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      // Update cart total price
      await this.prisma.cart.update({
        where: { id: cart.id },
        data: { totalPrice: 0 },
      });

      return this.apiResponse.ok(
        null,
        'Cart cleared successfully',
        '', // redirectUrl
        null, // data
      );
    } catch (error) {
      return this.apiResponse.error(
        'Failed to clear cart',
        500,
        error instanceof Error ? error.message : String(error),
      );
    }
  }
}
