import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService, Product } from '../../../core/services/product/product.service';
import { CartService } from '../../../core/services/cart/cart.service';
import { AuthService } from '../../../core/services/auth/auth.service';
import { NotificationService } from '../../../core/services/notifications/notifications.service';

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './products-list.component.html',
  styleUrls: ['./products-list.component.css']
})
export class ProductsListComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  
  // Search and filter variables
  searchQuery = '';
  sortOption = 'newest';
  
  // Loading states
  loading = true;
  error = false;
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 12;
  totalItems = 0;

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private authService: AuthService,
    private notificationService: NotificationService // Add this
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading = true;
    this.error = false;

    this.productService.getProducts().subscribe({
      next: (response) => {
        console.log('Response:', response); // Debug the response structure
        if (!Array.isArray(response)) {
          console.error('Unexpected response format:', response);
          this.error = true;
          this.loading = false;
          return;
        }
        this.products = response; // Assign the response directly
        this.filteredProducts = [...this.products];
        this.totalItems = this.products.length;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading products', err);
        this.error = true;
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    // Filter by search query
    let filtered = this.products;
    
    if (this.searchQuery?.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.description.toLowerCase().includes(query)
      );
    }
    
    // Then sort
    switch (this.sortOption) {
      case 'price_low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price_high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
      default:    
        filtered.sort((a, b) => Number(b.id) - Number(a.id));
        break;
    }
    
    this.filteredProducts = filtered;
  }

  searchProducts(): void {
    this.applyFilters();
  }

  sortProducts(): void {
    this.applyFilters();
  }

  addToCart(product: Product): void {
    if (!this.authService.isLoggedIn()) {
      // Redirect to login if not logged in
      this.authService.redirectToLogin();
      return;
    }
    
    this.cartService.addToCart(product.id, 1).subscribe({
      next: () => {
        // Replace alert with notification
        this.notificationService.success(`Added ${product.name} to cart!`);
      },
      error: (err) => {
        console.error('Error adding to cart', err);
        // Replace alert with notification
        this.notificationService.error('Failed to add product to cart');
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  get paginatedProducts(): Product[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredProducts.slice(startIndex, startIndex + this.itemsPerPage);
  }
  
  get totalPages(): number {
    return Math.ceil(this.filteredProducts.length / this.itemsPerPage);
  }
}