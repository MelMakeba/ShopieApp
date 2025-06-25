import { Component } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Shopie App';

  constructor(public router: Router) {}

  get isProductListPage(): boolean {
    return this.router.url.startsWith('/products');
  }
}
