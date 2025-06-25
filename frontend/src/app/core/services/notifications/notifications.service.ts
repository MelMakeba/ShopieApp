import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Notification {
  id: number;
  message: string; 
  type: 'success' | 'error' | 'info' | 'warning';
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationIdCounter = 0;
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  notifications$: Observable<Notification[]> = this.notificationsSubject.asObservable();

  constructor() {}

  success(message: string, timeout = 3000): void {
    this.addNotification({ message, type: 'success' }, timeout);
  }

  error(message: string, timeout = 5000): void {
    this.addNotification({ message, type: 'error' }, timeout);
  }

  info(message: string, timeout = 3000): void {
    this.addNotification({ message, type: 'info' }, timeout);
  }

  warning(message: string, timeout = 4000): void {
    this.addNotification({ message, type: 'warning' }, timeout);
  }

  private addNotification(notification: Partial<Notification>, timeout: number): void {
    const id = this.notificationIdCounter++;

    // Ensure message is always defined
    if (!notification.message) {
      throw new Error('Notification message is required');
    }

    const newNotification: Notification = {
      message: notification.message,
      type: notification.type || 'info',
      id
    };

    const currentNotifications = this.notificationsSubject.value;
    this.notificationsSubject.next([...currentNotifications, newNotification]);

    if (timeout > 0) {
      setTimeout(() => {
        this.removeNotification(id);
      }, timeout);
    }
  }

  removeNotification(id: number): void {
    const currentNotifications = this.notificationsSubject.value;
    this.notificationsSubject.next(
      currentNotifications.filter(notification => notification.id !== id)
    );
  }

  clearAll(): void {
    this.notificationsSubject.next([]);
  }
}