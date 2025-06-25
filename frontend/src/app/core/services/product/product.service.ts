import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image?: string;
  createdAt: Date; 
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = `http://localhost:3000/products`;

  constructor(private http: HttpClient) {}

  // Get all products (with optional pagination)
  getProducts(page: number = 1, limit: number = 10): Observable<Product[]> {
    return this.http.get<{ data: Product[] }>(`${this.apiUrl}/all?page=${page}&limit=${limit}`).pipe(
      map(response => response.data) // Extract the 'data' property
    );
  }

  // Get a single product by ID
  getProduct(productId: string): Observable<Product> {
    return this.http.get<{ data: Product }>(`${this.apiUrl}/${productId}`).pipe(
      map(response => response.data) // Extract the 'data' property
    );
  }

  // Search products
  searchProducts(query: string, page: number = 1, limit: number = 10): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/search?query=${query}&page=${page}&limit=${limit}`);
  }

  // Create a product (admin only) - with file upload
  createProduct(productData: FormData): Observable<Product> {
    return this.http.post<Product>(`${this.apiUrl}/create`, productData);
  }

  // Create a product (admin only) - JSON only
  createProductJson(product: Omit<Product, 'id' | 'createdAt'>): Observable<Product> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.post<Product>(`${this.apiUrl}/create`, product, { headers });
  }

  // Update a product (admin only) - with file upload (original method signature)
  updateProduct(id: string, productData: FormData): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/update/${id}`, productData);
  }

  // Update a product (admin only) - JSON only (for text fields update)
  updateProductJson(product: Product): Observable<Product> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    // Create clean product object with proper types
    const cleanProduct = {
      id: product.id,
      name: String(product.name).trim(),
      price: Number(product.price),
      stock: Number(product.stock),
      description: String(product.description).trim(),
      image: product.image || null
    };

    // Validate data types before sending
    if (isNaN(cleanProduct.price) || cleanProduct.price < 0) {
      throw new Error('Price must be a valid positive number');
    }
    
    if (isNaN(cleanProduct.stock) || cleanProduct.stock < 0) {
      throw new Error('Stock must be a valid positive number');
    }

    console.log('Sending product update:', cleanProduct);

    return this.http.put<Product>(`${this.apiUrl}/update/${product.id}`, cleanProduct, { headers });
  }

  // Alternative method if your backend expects different structure
  updateProductAlt(product: Product): Observable<Product> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const updateData = {
      name: String(product.name).trim(),
      price: Number(product.price),
      stock: Number(product.stock),
      description: String(product.description).trim()
    };

    return this.http.put<Product>(`${this.apiUrl}/update/${product.id}`, updateData, { headers });
  }

  // Delete a product (admin only)
  deleteProduct(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/delete/${id}`);
  }

  // Helper method to create FormData for file uploads
  createFormData(product: Partial<Product>, file?: File): FormData {
    const formData = new FormData();
    
    if (product.name) formData.append('name', product.name);
    if (product.description) formData.append('description', product.description);
    if (product.price !== undefined) formData.append('price', product.price.toString());
    if (product.stock !== undefined) formData.append('stock', product.stock.toString());
    if (file) formData.append('image', file);
    
    return formData;
  }

  // Method to update product with optional file
  updateProductComplete(id: string, product: Partial<Product>, file?: File): Observable<Product> {
    if (file) {
      // If there's a file, use FormData
      const formData = this.createFormData(product, file);
      return this.updateProduct(id, formData);
    } else {
      // If no file, use JSON update
      const fullProduct: Product = {
        id: id,
        name: product.name || '',
        description: product.description || '',
        price: Number(product.price) || 0,
        stock: Number(product.stock) || 0,
        image: product.image,
        createdAt: product.createdAt || new Date()
      };
      return this.updateProductJson(fullProduct);
    }
  }
}