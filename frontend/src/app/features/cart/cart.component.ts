import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService, CartItem } from '../../core/services/cart/cart.service';
import { NotificationService } from '../../core/services/notifications/notifications.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {
  cartItems: CartItem[] = [];
  loading = true;
  error = false;
  updatingQuantity = new Set<string>();
  
  constructor(
    private cartService: CartService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadCart();
  }

  loadCart(): void {
    this.loading = true;
    this.cartService.getCart().subscribe({
      next: (cart) => {
        this.cartItems = cart.items; // Extract the items array
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading cart', error);
        this.error = true;
        this.loading = false;
      }
    });
  }
  
  updateQuantity(item: CartItem, quantity: number): void {
    const availableStock = item.product.stock; 
    if (quantity < 1 || quantity > availableStock) return;
    
    this.updatingQuantity.add(item.id);
    this.cartService.updateCartItem(item.id, quantity).subscribe({
      next: () => {
        item.quantity = quantity;
        this.updatingQuantity.delete(item.id);
        this.notificationService.success('Item quantity updated');
      },
      error: (error) => {
        console.error('Error updating quantity', error);
        this.updatingQuantity.delete(item.id);
        this.notificationService.error('Failed to update quantity');
      }
    });
  }
  
  removeItem(itemId: string): void {
    if (confirm('Are you sure you want to remove this item from your cart?')) {
      this.cartService.removeCartItem(itemId).subscribe({
        next: () => {
          this.cartItems = this.cartItems.filter(item => item.id !== itemId);
          this.notificationService.success('Item removed from cart');
        },
        error: (error) => {
          console.error('Error removing item', error);
          this.notificationService.error('Failed to remove item. Please try again.');
        }
      });
    }
  }
  
  clearCart(): void {
    if (confirm('Are you sure you want to clear your entire cart?')) {
      this.cartService.clearCart().subscribe({
        next: () => {
          this.cartItems = [];
          this.notificationService.success('Cart cleared successfully');
        },
        error: (error) => {
          console.error('Error clearing cart', error);
          this.notificationService.error('Failed to clear cart. Please try again.');
        }
      });
    }
  }
  
  getSubtotal(): number {
    return this.cartItems.reduce((total, item) => {
      // Instead of item.product.price * item.quantity
      return total + (item.product.price * item.quantity);
    }, 0);
  }
  
  // Estimate tax at a fixed rate (for example 10%)
  getTax(): number {
    return this.getSubtotal() * 0.1;
  }
  
  // Fixed shipping cost - could be made dynamic based on location, weight, etc.
  getShipping(): number {
    return this.cartItems.length > 0 ? 5.99 : 0;
  }
  
  getTotal(): number {
    return this.getSubtotal() + this.getTax() + this.getShipping();
  }
}