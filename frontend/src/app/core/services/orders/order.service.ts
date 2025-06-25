import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  shippingAddress: string;
  paymentMethod: string;
  createdAt: Date;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = `http://localhost:3000/orders`;

  constructor(private http: HttpClient) {}

  createOrder(shippingAddress: string, paymentMethod: string): Observable<Order> {
    return this.http.post<ApiResponse<Order>>(`${this.apiUrl}/create`, { 
      shippingAddress, 
      paymentMethod 
    }).pipe(map(response => response.data));
  }

  getUserOrders(page: number, limit: number): Observable<ApiResponse<Order[]>> {
    return this.http.get<ApiResponse<Order[]>>(`${this.apiUrl}/user?page=${page}&limit=${limit}`);
  }

  getOrderById(id: string): Observable<Order> {
    return this.http.get<ApiResponse<Order>>(`${this.apiUrl}/${id}`)
      .pipe(map(response => response.data));
  }

  updateOrderStatus(id: string, status: string): Observable<Order> {
    return this.http.patch<ApiResponse<Order>>(`${this.apiUrl}/${id}/status`, { status })
      .pipe(map(response => response.data));
  }

  // Admin methods
  getAllOrders(): Observable<ApiResponse<Order[]>> {
    return this.http.get<ApiResponse<Order[]>>(`${this.apiUrl}/admin`);
  }
}