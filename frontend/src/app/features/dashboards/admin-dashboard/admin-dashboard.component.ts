import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductService, Product } from '../../../core/services/product/product.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.component.html'
})
export class AdminDashboardComponent implements OnInit {
  stats = {
    totalProducts: 0,
    lowStock: 0,
    totalOrders: 0,
    pendingOrders: 0
  };
  
  loading = true;
  error = false;

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.loading = true;
    this.productService.getProducts().subscribe({
      next: (products) => {
        console.log('Products:', products); // Debug the fetched products
        this.stats.totalProducts = products.length;
        this.stats.lowStock = products.filter((p: Product) => p.stock < 5).length;
        console.log('Stats:', this.stats); // Debug the calculated stats
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading stats', err);
        this.error = true;
        this.loading = false;
      }
    });
  }
}