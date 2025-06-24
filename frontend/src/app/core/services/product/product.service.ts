import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = `http://localhost:3000/products`;

  constructor(private http: HttpClient) {}

  getProducts(page: number = 1, limit: number = 10): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}?page=${page}&limit=${limit}`);
  }

  getProduct(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }

  searchProducts(query: string, page: number = 1, limit: number = 10): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/search?query=${query}&page=${page}&limit=${limit}`);
  }

  createProduct(productData: FormData): Observable<Product> {
    return this.http.post<Product>(`${this.apiUrl}`, productData);
  }

  updateProduct(id: string, productData: FormData | any): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/${id}`, productData);
  }

  deleteProduct(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}