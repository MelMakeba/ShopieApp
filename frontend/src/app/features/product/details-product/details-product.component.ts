import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Product } from '../../../core/services/product/product.service';
import { CartService } from '../../../core/services/cart/cart.service';
import { AuthService } from '../../../core/services/auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-product-details-overlay',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './details-product.component.html',
  styleUrls: ['./details-product.component.css']
})
export class ProductDetailsOverlayComponent {
  @Input() product: Product | null = null;
  @Output() close = new EventEmitter<void>();
  quantity = 1;
  showOverlay = true; // Add showOverlay property

  constructor(
    private cartService: CartService,
    private authService: AuthService,
    private router: Router
  ) {}

  closeOverlay(): void {
    console.log('Cancel button clicked'); // Debugging
    this.close.emit(); // Emit the close event
  }

  stopPropagation(event: Event): void {
    event.stopPropagation();
  }

  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  increaseQuantity(): void {
    const maxQuantity = this.product?.stock || 0;
    if (this.quantity < maxQuantity) {
      this.quantity++;
    }
  }

  addToCart(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.product) {
      this.cartService.addToCart(this.product.id, this.quantity).subscribe({
        next: () => {
          this.close.emit();
          alert(`Added ${this.quantity} x ${this.product?.name} to cart!`);
        },
        error: (err) => {
          console.error('Error adding to cart', err);
          alert('Failed to add product to cart');
        }
      });
    }
  }

  handleCloseOverlay(): void {
    this.showOverlay = false; // Hide the overlay
    this.router.navigate(['/products']); // Navigate to the products page
  }
}