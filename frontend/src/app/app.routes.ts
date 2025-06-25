import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layouts/main-layout/main-layout/main-layout.component';
import { HomeComponent } from './features/home/home/home.component';
import { authGuard } from './core/guards/auth/auth.guard';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout/admin-layout.component';
import { adminGuard } from './core/guards/auth/admin.guard';

export const routes: Routes = [
    {
        path: '',
        component: MainLayoutComponent,
        children:[
            {path: '', component: HomeComponent},
            // Cart and product routes
            {
              path: 'cart',
              loadComponent: () => import('./features/cart/cart.component').then(c => c.CartComponent),
              canActivate: [authGuard]
            },
            {
              path: 'products',
              loadComponent: () => import('./features/products/products-list/products-list.component').then(c => c.ProductsListComponent)
            },
            {
              path: 'products/:id',
              loadComponent: () => import('./features/product/details-product/details-product.component').then(c => c.ProductDetailsOverlayComponent)
            },
            // User routes
            {
              path: 'user',
              children: [
                {
                  path: '',
                  redirectTo: 'dashboard',
                  pathMatch: 'full'
                },
                {
                  path: 'dashboard',
                  loadComponent: () => import('./features/dashboards/user-dashboard/user-dashboard.component').then(c => c.UserDashboardComponent)
                },
                {
                  path: 'profile',
                  loadComponent: () => import('./features/dashboards/user-profile/user-profile.component').then(c => c.UserProfileComponent)
                },
                // {
                //   path: 'orders',
                //   loadComponent: () => import('./features/dashboards/user-orders/user-orders.component').then(c => c.UserOrdersComponent)
                // },
                // {
                //   path: 'addresses',
                //   loadComponent: () => import('./features/dashboards/user-addresses/user-addresses.component').then(c => c.UserAddressesComponent)
                // }
              ],
              canActivate: [authGuard]
            },
            // Auth routes
            {
              path: 'login',
              loadComponent: () => import('./features/auth/login/login.component').then(c => c.LoginComponent)
            },
            {
              path: 'register',
              loadComponent: () => import('./features/auth/register/register.component').then(c => c.RegisterComponent)
            },
            {
              path: 'forgot-password',
              loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(c => c.ForgotPasswordComponent)
            },
            {
              path: 'reset-password',
              loadComponent: () => import('./features/auth/reset-password/reset-password.component').then(c => c.ResetPasswordComponent)
            }
        ]
    },
    {
        path: 'admin',
        component: AdminLayoutComponent,
        canActivate: [adminGuard],
        children: [
          {
            path: '',
            redirectTo: 'dashboard',
            pathMatch: 'full'
          },
          {
            path: 'dashboard',
            loadComponent: () => import('./features/dashboards/admin-dashboard/admin-dashboard.component').then(c => c.AdminDashboardComponent)
          },
          {
            path: 'products',
            loadChildren: () => import('./features/admin/products/products.routes').then(m => m.ADMIN_PRODUCT_ROUTES)
          },
          // {
          //   path: 'orders',
          //   loadChildren: () => import('./features/admin-dashboard/orders/orders.routes').then(m => m.ADMIN_ORDER_ROUTES)
          // }
        ]
      },
      { path: '**', redirectTo: '' }
];
