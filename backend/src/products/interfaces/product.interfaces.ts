export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string | null; // Changed from imageUrl to match your schema
  stock: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductsPage {
  items: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
