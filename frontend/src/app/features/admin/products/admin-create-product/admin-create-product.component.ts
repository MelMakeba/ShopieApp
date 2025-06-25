import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService } from '../../../../core/services/product/product.service';
import { NotificationService } from '../../../../core/services/notifications/notifications.service';

@Component({
  selector: 'app-admin-create-product',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-create-product.component.html'
})
export class AdminCreateProductComponent implements OnInit {
  productForm!: FormGroup;
  imagePreview: string | null = null;
  loading = false;
  
  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.productForm = this.fb.group({
      name: ['', [Validators.required]],
      description: ['', [Validators.required]],
      price: ['', [Validators.required, Validators.min(0)]],
      stock: ['', [Validators.required, Validators.min(0)]],
      image: [null]
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
      this.productForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    
    const formData = new FormData();
    formData.append('name', this.productForm.get('name')?.value);
    formData.append('description', this.productForm.get('description')?.value);
    formData.append('price', this.productForm.get('price')?.value);
    formData.append('stock', this.productForm.get('stock')?.value);
    
    const imageFile = this.productForm.get('image')?.value;
    if (imageFile) {
      formData.append('image', imageFile);
    }

    this.productService.createProduct(formData).subscribe({
      next: () => {
        this.notificationService.success('Product created successfully');
        this.router.navigate(['/admin/products']);
      },
      error: (err) => {
        console.error('Error creating product', err);
        this.notificationService.error('Failed to create product');
        this.loading = false;
      }
    });
  }
}