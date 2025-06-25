import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

// Function-based interceptor for Angular standalone API
export const authInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const token = localStorage.getItem('token');
  console.log('Intercepting request:', request.url); // Debug the request URL
  console.log('Token:', token); // Debug the token

  if (token) {
    const authReq = request.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
    console.log('Authorization header added:', authReq.headers.get('Authorization')); // Debug the header
    return next(authReq);
  }
  return next(request);
};