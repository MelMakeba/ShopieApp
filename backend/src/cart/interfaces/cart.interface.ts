export interface CartItem {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    image: string;
  };
  quantity: number;
  price: number;
  createdAt: Date;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  totalPrice: number;
  createdAt: Date;
  updatedAt: Date;
}
