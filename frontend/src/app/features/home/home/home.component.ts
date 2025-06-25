import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductCardComponent } from '../../../shared/product-card/product-card/product-card.component';
import { ProductService, Product } from '../../../core/services/product/product.service';
import { CartService } from '../../../core/services/cart/cart.service';
import { AuthService } from '../../../core/services/auth/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductCardComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  featuredProducts: Product[] = [];
  loading = true;

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadFeaturedProducts();
  }

  loadFeaturedProducts(): void {
    this.productService.getProducts(1, 8).subscribe({
      next: (response) => {
        this.featuredProducts = response;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading products', err);
        this.loading = false;
      }
    });
  }

  addToCart(product: Product): void {
    if (!this.authService.isLoggedIn()) {
      window.location.href = '/login';
      return;
    }

    this.cartService.addToCart(product.id).subscribe({
      next: () => {
        alert(`Added ${product.name} to cart!`);
      },
      error: (err) => {
        console.error('Error adding to cart', err);
      }
    });
  }
}