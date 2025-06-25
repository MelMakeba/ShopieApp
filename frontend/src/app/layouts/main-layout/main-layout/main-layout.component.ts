import { Component, OnInit } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../../shared/navbar/navbar/navbar.component';
import { FooterComponent } from '../../../shared/footer/footer/footer.component';
import { DashboardHeaderComponent } from '../../../shared/dashboard-header/dashboard-header.component';
import { filter } from 'rxjs/operators';
import { NotificationsComponent } from '../../../shared/notifications/notifications.component';


@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, FooterComponent, DashboardHeaderComponent, NotificationsComponent],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.css']
})
export class MainLayoutComponent implements OnInit {
  isDashboardRoute = false;
  isProductListRoute = false; // Add this line

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.isDashboardRoute = this.checkIfDashboardRoute(this.router.url);
    this.isProductListRoute = this.checkIfProductListRoute(this.router.url); // Add this line

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.isDashboardRoute = this.checkIfDashboardRoute(event.url);
      this.isProductListRoute = this.checkIfProductListRoute(event.url); // Add this line
    });
  }

  private checkIfDashboardRoute(url: string): boolean {
    return url.includes('/user') || url.includes('/admin');
  }

  private checkIfProductListRoute(url: string): boolean {
    return url.startsWith('/products'); // Adjust if your route is different
  }
}