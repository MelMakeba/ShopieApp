import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';

// User interfaces
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  avatar?: string;
  address?: Address;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private apiUrl = 'http://localhost:3000';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  changePassword: any;
  
  constructor(private http: HttpClient) { }

  /**
   * Get the current user's profile
   * Matches endpoint: GET /users/get-profile
   */
  getCurrentUser(): Observable<User> {
    return this.http.get<{ data: User }>(`${this.apiUrl}/users/get-profile`).pipe(
      map(response => response.data), // Extract the user object from the data property
      tap(user => {
        this.currentUserSubject.next(user);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Update user profile information
   * Matches endpoint: PUT /users/update-profile
   */
  updateProfile(profileData: UpdateProfileRequest): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/update-profile`, profileData).pipe(
      tap(user => {
        this.currentUserSubject.next(user);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Delete user account
   * Matches endpoint: DELETE /users/delete
   */
  deleteAccount(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/users/delete`).pipe(
      tap(() => {
        this.currentUserSubject.next(null);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Error handler
   */
  private handleError(error: any) {
    console.error('An error occurred:', error);
    
    let errorMessage = 'An unknown error occurred';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = error.error?.message || `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Get the current user value without subscribing
   */
  public getCurrentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Clear current user data
   */
  public clearCurrentUser(): void {
    this.currentUserSubject.next(null);
  }

  /**
   * Check if current user is admin
   */
  public isAdmin(): boolean {
    const user = this.getCurrentUserValue();
    return user?.role === 'admin';
  }

}

