import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UsersService } from '../../../core/services/users/users.service';
import { OrderService } from '../../../core/services/orders/order.service';
import { AuthService } from '../../../core/services/auth/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.css']
})
export class UserDashboardComponent implements OnInit, OnDestroy {
  user: any;
  recentOrders: any[] = [];
  loading = {
    profile: false,
    update: false,
    orders: false
  };
  error = {
    profile: '',
    update: '',
    orders: ''
  };
  success = {
    update: false
  };
  
  // Add the missing property that's used in the template
  orderLoading = false;
  
  profileForm!: FormGroup;
  activeTab = 'profile';
  private subscriptions: Subscription[] = [];
  
  // Add helper method for calculating total
  getTotalSpent(): number {
    return this.recentOrders?.reduce((total, order) => total + order.totalAmount, 0) || 0;
  }
  
  constructor(
    private userService: UsersService,
    private orderService: OrderService,
    private authService: AuthService,
    private formBuilder: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initProfileForm();
    this.loadUserData();
    this.loadRecentOrders();
  }
  
  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  initProfileForm(): void {
    this.profileForm = this.formBuilder.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      address: [''],
      city: [''],
      state: [''],
      zipCode: ['']
    });
  }

  loadUserData(): void {
    this.loading.profile = true;
    this.userService.getCurrentUser().subscribe({
      next: (user) => {
        this.user = user;
        this.profileForm.patchValue({
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          address: user.address || '',
          });
        this.loading.profile = false;
      },
      error: (error) => {
        console.error('Error loading user data', error);
        this.error.profile = error?.error?.message || 'Failed to load user data';
        this.loading.profile = false;
      }
    });
  }

  loadRecentOrders(): void {
    this.orderLoading = true;
    this.orderService.getUserOrders(1, 5).subscribe({
      next: (response) => {
        // Make sure each order has a status
        this.recentOrders = response.data.map(order => ({
          ...order,
          status: order.status || 'PENDING', // Default status if missing
          itemCount: order.items?.length || 0 // Also add item count
        }));
        this.orderLoading = false;
      },
      error: (error) => {
        console.error('Error loading orders', error);
        this.error.orders = error?.error?.message || 'Failed to load orders';
        this.orderLoading = false;
      }
    });
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  updateProfile(): void {
    if (this.profileForm.invalid) {
      return;
    }

    this.loading.update = true;
    this.error.update = '';
    this.success.update = false;

    this.userService.updateProfile(this.profileForm.value).subscribe({
      next: (updatedUser) => {
        this.user = updatedUser;
        this.loading.update = false;
        this.success.update = true;
        
        // Update the user info in auth service
        const currentUser = this.authService.getCurrentUser();
        if (currentUser) {
          // Just update the current user data without logging out
          this.authService.updateCurrentUser({
            ...currentUser,
            name: updatedUser.name
          });
        }
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          this.success.update = false;
        }, 3000);
      },
      error: (error) => {
        console.error('Error updating profile', error);
        this.error.update = error?.error?.message || 'Failed to update profile';
        this.loading.update = false;
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}