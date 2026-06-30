export type OrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Delivered';

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
}

export interface OrderStatusHistory {
  status: OrderStatus;
  updatedAt: Date;
  updatedBy: string;
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  totalPrice: number;
  orderDate: Date;
  status: OrderStatus;
  statusHistory: OrderStatusHistory[];
}
