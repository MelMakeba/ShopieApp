import { Routes } from '@angular/router';

export const ADMIN_PRODUCT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./admin-product-list/admin-product-list.component').then(c => c.AdminProductListComponent)
  },
  {
    path: 'create',
    loadComponent: () => import('./admin-create-product/admin-create-product.component').then(c => c.AdminCreateProductComponent)
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./admin-product-edit/admin-product-edit.component').then(c => c.AdminProductEditComponent)
  }
];