import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = `http://localhost:3000/cart`;
  private cartSubject = new BehaviorSubject<Cart | null>(null);
  cart$ = this.cartSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadCart();
  }

  private loadCart(): void {
    if (localStorage.getItem('token')) {
      this.getCart().subscribe();
    }
  }

  getCart(): Observable<Cart> {
    return this.http.get<Cart>(this.apiUrl).pipe(
      tap(cart => {
        this.cartSubject.next(cart);
      })
    );
  }

  addToCart(productId: string, quantity: number = 1): Observable<Cart> {
    return this.http.post<Cart>(`${this.apiUrl}/items`, { productId, quantity }).pipe(
      tap(cart => {
        this.cartSubject.next(cart);
      })
    );
  }

  updateCartItem(itemId: string, quantity: number): Observable<Cart> {
    return this.http.put<Cart>(`${this.apiUrl}/items/${itemId}`, { quantity }).pipe(
      tap(cart => {
        this.cartSubject.next(cart);
      })
    );
  }

  removeCartItem(itemId: string): Observable<Cart> {
    return this.http.delete<Cart>(`${this.apiUrl}/items/${itemId}`).pipe(
      tap(cart => {
        this.cartSubject.next(cart);
      })
    );
  }

  clearCart(): Observable<any> {
    return this.http.delete<any>(this.apiUrl).pipe(
      tap(() => {
        this.cartSubject.next(null);
      })
    );
  }

  getCartItemCount(): number {
    return this.cartSubject.value?.totalItems || 0;
  }
}