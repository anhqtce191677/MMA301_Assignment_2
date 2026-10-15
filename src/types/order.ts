import { CartItem } from './cart';

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderCustomerInfo {
  fullName: string;
  phone: string;
  address: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  totalAmount: number;
  totalQuantity: number;
  customer: OrderCustomerInfo;
  createdAt: string;
  status: OrderStatus;
  paymentMethod: string;
}
