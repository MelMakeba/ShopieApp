import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService, Product } from '../../../../core/services/product/product.service';
import { NotificationService } from '../../../../core/services/notifications/notifications.service';

@Component({
  selector: 'app-admin-product-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-product-list.component.html'
})
export class AdminProductListComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  searchQuery = '';
  loading = true;
  error = false;
  selectedProduct: Product | null = null;
  isEditing = false;
  
  constructor(
    private productService: ProductService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading = true;
    this.error = false;

    this.productService.getProducts().subscribe({
      next: (response) => {
        console.log(response); // Debug the response structure
        this.products = response; // Assign the array of products
        this.filteredProducts = [...this.products];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading products', err);
        this.error = true;
        this.loading = false;
      }
    });
  }

  search(): void {
    if (!this.searchQuery.trim()) {
      this.filteredProducts = [...this.products];
      return;
    }
    
    const query = this.searchQuery.toLowerCase();
    this.filteredProducts = this.products.filter(product => 
      product.name.toLowerCase().includes(query) || 
      product.description.toLowerCase().includes(query)
    );
  }

  deleteProduct(id: string): void {
    if (confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      this.productService.deleteProduct(id).subscribe({
        next: () => {
          this.products = this.products.filter(p => p.id !== id);
          this.filteredProducts = this.filteredProducts.filter(p => p.id !== id);
          this.notificationService.success('Product deleted successfully');
        },
        error: (err) => {
          console.error('Error deleting product', err);
          this.notificationService.error('Failed to delete product');
        }
      });
    }
  }

  // Select product for editing
  selectProduct(product: Product): void {
    this.selectedProduct = { ...product }; // Create a copy to avoid direct mutation
    this.isEditing = true;
  }

  // Cancel editing
  cancelEdit(): void {
    this.selectedProduct = null;
    this.isEditing = false;
  }

  // Validate product data
  private validateProduct(product: Product): string[] {
    const errors: string[] = [];
    
    if (!product.name?.trim()) {
      errors.push('Product name is required');
    }
    
    if (!product.description?.trim()) {
      errors.push('Product description is required');
    }
    
    const price = Number(product.price);
    if (isNaN(price) || price < 0) {
      errors.push('Price must be a valid positive number');
    }
    
    const stock = Number(product.stock);
    if (isNaN(stock) || stock < 0) {
      errors.push('Stock must be a valid positive number');
    }
    
    return errors;
  }

  // Update product with proper data type conversion
  updateProduct(): void {
    if (!this.selectedProduct) {
      this.notificationService.error('No product selected for update');
      return;
    }
    
    // Validate the product data
    const validationErrors = this.validateProduct(this.selectedProduct);
    if (validationErrors.length > 0) {
      this.notificationService.error(validationErrors.join(', '));
      return;
    }
    
    // Create updated product with proper data types - ensure clean object
    const updatedProduct: Product = {
      id: this.selectedProduct.id,
      name: String(this.selectedProduct.name).trim(),
      price: Number(this.selectedProduct.price),
      stock: Number(this.selectedProduct.stock),
      description: String(this.selectedProduct.description).trim(),
      image: this.selectedProduct.image || undefined,
      createdAt: this.selectedProduct.createdAt // Keep original createdAt if not updating
    };
    
    // Additional validation after conversion
    if (isNaN(updatedProduct.price) || updatedProduct.price < 0) {
      this.notificationService.error('Invalid price value');
      return;
    }
    
    if (isNaN(updatedProduct.stock) || updatedProduct.stock < 0) {
      this.notificationService.error('Invalid stock value');
      return;
    }
    
    console.log('Updating product:', updatedProduct);
    console.log('Price type:', typeof updatedProduct.price, 'Value:', updatedProduct.price);
    console.log('Stock type:', typeof updatedProduct.stock, 'Value:', updatedProduct.stock);
    
    this.productService.updateProductJson(updatedProduct).subscribe({
      next: (response) => {
        // Update the product in the local arrays
        const index = this.products.findIndex(p => p.id === updatedProduct.id);
        if (index !== -1) {
          this.products[index] = response;
        }
        
        const filteredIndex = this.filteredProducts.findIndex(p => p.id === updatedProduct.id);
        if (filteredIndex !== -1) {
          this.filteredProducts[filteredIndex] = response;
        }
        
        this.notificationService.success('Product updated successfully');
        this.cancelEdit(); // Close the edit form
      },
      error: (err) => {
        console.error('Error updating product:', err);
        console.error('Full error object:', JSON.stringify(err, null, 2));
        
        // Handle specific error messages from backend
        if (err.error && err.error.message) {
          if (Array.isArray(err.error.message)) {
            this.notificationService.error(err.error.message.join(', '));
          } else {
            this.notificationService.error(err.error.message);
          }
        } else {
          this.notificationService.error('Failed to update product');
        }
      }
    });
  }

  // Helper method to format price for display
  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  }
}