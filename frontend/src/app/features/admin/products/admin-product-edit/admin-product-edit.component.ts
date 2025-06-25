import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProductService } from '../../../../core/services/product/product.service';
import { NotificationService } from '../../../../core/services/notifications/notifications.service';

@Component({
  selector: 'app-admin-product-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './admin-product-edit.component.html'
})
export class AdminProductEditComponent implements OnInit {
  productId = '';
  productForm!: FormGroup;
  imagePreview: string | null = null;
  currentImage: string | null = null;
  loading = false;
  loadingProduct = true;
  error = false;
  
  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.productId = this.route.snapshot.paramMap.get('id') || '';
    if (this.productId) {
      this.loadProduct();
    } else {
      this.router.navigate(['/admin/products']);
    }
  }

  initForm(): void {
    this.productForm = this.fb.group({
      price: ['', [Validators.required, Validators.min(0)]], // Price must be >= 0
      stock: ['', [Validators.required, Validators.min(0)]], // Stock must be >= 0
      name: ['', [Validators.required]],
      description: ['', [Validators.required]]
    });
  }

  loadProduct(): void {
    this.loadingProduct = true;
    this.error = false;

    this.productService.getProduct(this.productId).subscribe({
      next: (product) => {
        console.log(product); // Debug the product structure

        
        this.productForm.patchValue({
          name: product.name,
          description: product.description,
          price: product.price,
          stock: product.stock
        });

        if (product.image) {
          this.currentImage = product.image;
          this.imagePreview = product.image;
        }

        this.loadingProduct = false;
      },
      error: (err) => {
        console.error('Error loading product', err);
        this.error = true;
        this.loadingProduct = false;
        this.notificationService.error('Failed to load product details');
      }
    });
  }

  onFileChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.productForm.patchValue({ image: file });
    
    // Create a preview
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  onSubmit(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched(); // Highlight invalid fields
      this.notificationService.error('Please fix the errors in the form');
      return;
    }

    const formData = new FormData();
    formData.append('price', String(this.productForm.get('price')?.value)); // Convert to string
    formData.append('stock', String(this.productForm.get('stock')?.value)); // Convert to string
    formData.append('name', this.productForm.get('name')?.value);
    formData.append('description', this.productForm.get('description')?.value);

    const imageFile = this.productForm.get('image')?.value;
    if (imageFile && imageFile !== this.currentImage) {
      formData.append('image', imageFile);
    }

    this.productService.updateProduct(this.productId, formData).subscribe({
      next: () => {
        this.notificationService.success('Product updated successfully');
        this.router.navigate(['/admin/products']);
      },
      error: (err) => {
        console.error('Error updating product', err);
        this.notificationService.error('Failed to update product');
      }
    });
  }
}