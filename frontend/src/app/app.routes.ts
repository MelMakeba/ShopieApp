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
            // {
            //     path: 'products',
            //     loadChildren: () => import('.features/product/products/products.component'). then(m => m.PRODUCTS_ROUTES)
            //     },
            //     {
            //         path: 'cart',
            //         loadChildren: () => import('./features/cart/cart.routes').then(m => m.CART_ROUTES),
            //         canActivate: [authGuard]
            //       },
            //       {
            //         path: 'checkout',
            //         loadChildren: () => import('./features/checkout/checkout.routes').then(m => m.CHECKOUT_ROUTES),
            //         canActivate: [authGuard]
            //       },
            //       {
            //         path: 'user',
            //         loadChildren: () => import('./features/user-dashboard/user-dashboard.routes').then(m => m.USER_DASHBOARD_ROUTES),
            //         canActivate: [authGuard]
            //       },
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
        //   {
        //     path: 'dashboard',
        //     loadComponent: () => import('./features/admin-dashboard/dashboard/admin-dashboard.component').then(c => c.AdminDashboardComponent)
        //   },
        //   {
        //     path: 'products',
        //     loadChildren: () => import('./features/admin-dashboard/products/products.routes').then(m => m.ADMIN_PRODUCT_ROUTES)
        //   },
        //   {
        //     path: 'orders',
        //     loadChildren: () => import('./features/admin-dashboard/orders/orders.routes').then(m => m.ADMIN_ORDER_ROUTES)
        //   }
        ]
      },
      { path: '**', redirectTo: '' }
];
