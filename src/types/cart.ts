import { Product } from './product';

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CartTotals {
  totalItems: number;
  subtotal: number;
  discount: number;
  shipping: number;
  grandTotal: number;
}
