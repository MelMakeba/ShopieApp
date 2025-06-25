import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, map } from 'rxjs/operators';

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    stock: number;
    imageUrl?: string;
  };
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  totalItems?: number; 
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = `http://localhost:3000/cart`;
  private cartSubject = new BehaviorSubject<Cart | null>(null);
  cart$ = this.cartSubject.asObservable();
  cartItems$: any;

  constructor(private http: HttpClient) {
    this.loadCart();
  }

  private loadCart(): void {
    if (localStorage.getItem('token')) {
      this.getCart().subscribe();
    }
  }

  getCart(): Observable<Cart> {
    return this.http.get<{ data: any }>(`${this.apiUrl}`).pipe(
      map(response => {
        const cartData = response.data;
        return {
          id: cartData.id,
          userId: cartData.userId,
          items: cartData.CartItem.map((item: any) => ({
            id: item.id,
            productId: item.productId,
            quantity: item.quantity,
            product: item.product,
            imageUrl: item.product.image // Map 'product.image' directly to 'imageUrl'
          })),
          totalItems: cartData.CartItem.reduce((total: number, item: any) => total + item.quantity, 0)
        } as Cart;
      }),
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