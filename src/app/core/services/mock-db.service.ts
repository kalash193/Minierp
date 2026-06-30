import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, map, take } from 'rxjs/operators';
import { User } from '../models/user.model';
import { Product } from '../models/product.model';
import { Order, OrderStatus } from '../models/order.model';
import { RecentActivity } from '../models/activity.model';

@Injectable({
  providedIn: 'root'
})
export class MockDbService {
  private readonly STORAGE_PREFIX = 'minierp_';

  // Seed Data
  private readonly defaultUsers: User[] = [
    { id: 'usr-1', email: 'admin@minierp.com', name: 'Admin User', role: 'Admin', isActive: true },
    { id: 'usr-2', email: 'staff@minierp.com', name: 'Staff User', role: 'Staff', isActive: true },
    { id: 'usr-3', email: 'manager@minierp.com', name: 'John Manager', role: 'Staff', isActive: true },
    { id: 'usr-4', email: 'disabled@minierp.com', name: 'Jane Inactive', role: 'Staff', isActive: false }
  ];

  private readonly defaultProducts: Product[] = [
    { id: 'prd-1', sku: 'PRD001', name: 'Laptop Pro 15', price: 1299.99, stock: 15, minStock: 5, category: 'Electronics' },
    { id: 'prd-2', sku: 'PRD002', name: 'Wireless Mouse', price: 29.99, stock: 4, minStock: 10, category: 'Electronics' },
    { id: 'prd-3', sku: 'PRD003', name: 'Mechanical Keyboard', price: 89.99, stock: 25, minStock: 8, category: 'Electronics' },
    { id: 'prd-4', sku: 'PRD004', name: 'Office Chair', price: 199.99, stock: 12, minStock: 3, category: 'Furniture' },
    { id: 'prd-5', sku: 'PRD005', name: 'Standing Desk', price: 499.99, stock: 8, minStock: 2, category: 'Furniture' },
    { id: 'prd-6', sku: 'PRD006', name: 'Coffee Mug', price: 12.50, stock: 100, minStock: 15, category: 'Kitchenware' },
    { id: 'prd-7', sku: 'PRD007', name: 'Water Bottle', price: 19.99, stock: 3, minStock: 5, category: 'Kitchenware' },
    { id: 'prd-8', sku: 'PRD008', name: 'Noise Cancelling Headphones', price: 149.99, stock: 18, minStock: 5, category: 'Electronics' },
    { id: 'prd-9', sku: 'PRD009', name: 'Bluetooth Speaker', price: 59.99, stock: 0, minStock: 5, category: 'Electronics' },
    { id: 'prd-10', sku: 'PRD010', name: 'Desk Lamp', price: 34.99, stock: 20, minStock: 5, category: 'Furniture' }
  ];

  private readonly defaultOrders: Order[] = [
    {
      id: 'ord-1001',
      customerName: 'Alice Smith',
      customerEmail: 'alice@example.com',
      items: [
        { productId: 'prd-1', productName: 'Laptop Pro 15', price: 1299.99, quantity: 1 },
        { productId: 'prd-2', productName: 'Wireless Mouse', price: 29.99, quantity: 1 }
      ],
      totalPrice: 1329.98,
      orderDate: new Date('2026-06-15T10:30:00Z'),
      status: 'Delivered',
      statusHistory: [
        { status: 'Pending', updatedAt: new Date('2026-06-15T10:30:00Z'), updatedBy: 'System' },
        { status: 'Processing', updatedAt: new Date('2026-06-15T12:00:00Z'), updatedBy: 'Admin User' },
        { status: 'Shipped', updatedAt: new Date('2026-06-16T09:00:00Z'), updatedBy: 'Staff User' },
        { status: 'Delivered', updatedAt: new Date('2026-06-17T15:30:00Z'), updatedBy: 'Staff User' }
      ]
    },
    {
      id: 'ord-1002',
      customerName: 'Bob Jones',
      customerEmail: 'bob@example.com',
      items: [
        { productId: 'prd-4', productName: 'Office Chair', price: 199.99, quantity: 2 }
      ],
      totalPrice: 399.98,
      orderDate: new Date('2026-06-25T14:15:00Z'),
      status: 'Shipped',
      statusHistory: [
        { status: 'Pending', updatedAt: new Date('2026-06-25T14:15:00Z'), updatedBy: 'System' },
        { status: 'Processing', updatedAt: new Date('2026-06-26T10:00:00Z'), updatedBy: 'Admin User' },
        { status: 'Shipped', updatedAt: new Date('2026-06-27T11:00:00Z'), updatedBy: 'Staff User' }
      ]
    },
    {
      id: 'ord-1003',
      customerName: 'Charlie Brown',
      customerEmail: 'charlie@example.com',
      items: [
        { productId: 'prd-5', productName: 'Standing Desk', price: 499.99, quantity: 1 },
        { productId: 'prd-10', productName: 'Desk Lamp', price: 34.99, quantity: 2 }
      ],
      totalPrice: 569.97,
      orderDate: new Date('2026-06-28T09:00:00Z'),
      status: 'Processing',
      statusHistory: [
        { status: 'Pending', updatedAt: new Date('2026-06-28T09:00:00Z'), updatedBy: 'System' },
        { status: 'Processing', updatedAt: new Date('2026-06-29T10:30:00Z'), updatedBy: 'Admin User' }
      ]
    },
    {
      id: 'ord-1004',
      customerName: 'Diana Prince',
      customerEmail: 'diana@example.com',
      items: [
        { productId: 'prd-7', productName: 'Water Bottle', price: 19.99, quantity: 5 }
      ],
      totalPrice: 99.95,
      orderDate: new Date('2026-06-29T16:45:00Z'),
      status: 'Pending',
      statusHistory: [
        { status: 'Pending', updatedAt: new Date('2026-06-29T16:45:00Z'), updatedBy: 'System' }
      ]
    },
    {
      id: 'ord-1005',
      customerName: 'Evan Wright',
      customerEmail: 'evan@example.com',
      items: [
        { productId: 'prd-6', productName: 'Coffee Mug', price: 12.50, quantity: 10 }
      ],
      totalPrice: 125.00,
      orderDate: new Date('2026-06-30T11:00:00Z'),
      status: 'Pending',
      statusHistory: [
        { status: 'Pending', updatedAt: new Date('2026-06-30T11:00:00Z'), updatedBy: 'System' }
      ]
    }
  ];

  private readonly defaultActivities: RecentActivity[] = [
    { id: 'act-1', description: 'User admin@minierp.com logged in successfully', timestamp: new Date('2026-06-30T10:00:00Z'), user: 'Admin User', type: 'auth' },
    { id: 'act-2', description: 'Product Standing Desk stock updated to 8', timestamp: new Date('2026-06-29T10:30:00Z'), user: 'Admin User', type: 'product' },
    { id: 'act-3', description: 'Created Order ord-1005 for Evan Wright', timestamp: new Date('2026-06-30T11:00:00Z'), user: 'System', type: 'order' }
  ];

  // Subjects holding dynamic status
  private usersSubject = new BehaviorSubject<User[]>([]);
  private productsSubject = new BehaviorSubject<Product[]>([]);
  private ordersSubject = new BehaviorSubject<Order[]>([]);
  private activitiesSubject = new BehaviorSubject<RecentActivity[]>([]);

  private delayTime = 400; // simulated network delay in ms

  constructor() {
    this.initDatabase();
  }

  private initDatabase() {
    this.usersSubject.next(this.getOrSeed('users', this.defaultUsers));
    this.productsSubject.next(this.getOrSeed('products', this.defaultProducts));
    this.ordersSubject.next(this.getOrSeed('orders', this.defaultOrders));
    this.activitiesSubject.next(this.getOrSeed('activities', this.defaultActivities));
  }

  private getOrSeed<T>(key: string, seed: T): T {
    const fullKey = this.STORAGE_PREFIX + key;
    const item = localStorage.getItem(fullKey);
    if (item) {
      try {
        // Parse dates correctly since JSON.parse leaves dates as strings
        return JSON.parse(item, (k, v) => {
          if (k === 'orderDate' || k === 'updatedAt' || k === 'timestamp') {
            return new Date(v);
          }
          return v;
        });
      } catch {
        // Fallback to seed on parse error
      }
    }
    localStorage.setItem(fullKey, JSON.stringify(seed));
    return seed;
  }

  private sync(key: string, data: any) {
    localStorage.setItem(this.STORAGE_PREFIX + key, JSON.stringify(data));
  }

  // --- LOGGING ---
  public logActivity(description: string, user: string, type: 'auth' | 'product' | 'order' | 'user'): void {
    const current = this.activitiesSubject.value;
    const item: RecentActivity = {
      id: 'act-' + Date.now(),
      description,
      timestamp: new Date(),
      user,
      type
    };
    const updated = [item, ...current].slice(0, 50); // cap at 50 logs
    this.activitiesSubject.next(updated);
    this.sync('activities', updated);
  }

  // --- USERS ---
  public getUsers(): Observable<User[]> {
    return this.usersSubject.asObservable().pipe(take(1), delay(this.delayTime));
  }

  public saveUser(user: User): Observable<User> {
    return of(user).pipe(
      delay(this.delayTime),
      map(u => {
        const list = [...this.usersSubject.value];
        const idx = list.findIndex(item => item.id === u.id);
        if (idx > -1) {
          list[idx] = u;
        } else {
          u.id = 'usr-' + Date.now();
          list.push(u);
        }
        this.usersSubject.next(list);
        this.sync('users', list);
        return u;
      })
    );
  }

  // --- PRODUCTS ---
  public getProducts(): Observable<Product[]> {
    return this.productsSubject.asObservable().pipe(take(1), delay(this.delayTime));
  }

  public saveProduct(product: Product): Observable<Product> {
    return of(product).pipe(
      delay(this.delayTime),
      map(p => {
        const list = [...this.productsSubject.value];
        const idx = list.findIndex(item => item.id === p.id);
        if (idx > -1) {
          list[idx] = p;
        } else {
          p.id = 'prd-' + Date.now();
          list.push(p);
        }
        this.productsSubject.next(list);
        this.sync('products', list);
        return p;
      })
    );
  }

  public deleteProduct(id: string): Observable<boolean> {
    return of(id).pipe(
      delay(this.delayTime),
      map(pid => {
        const list = this.productsSubject.value.filter(p => p.id !== pid);
        this.productsSubject.next(list);
        this.sync('products', list);
        return true;
      })
    );
  }

  // --- ORDERS ---
  public getOrders(): Observable<Order[]> {
    return this.ordersSubject.asObservable().pipe(take(1), delay(this.delayTime));
  }

  public saveOrder(order: Order): Observable<Order> {
    return of(order).pipe(
      delay(this.delayTime),
      map(o => {
        const list = [...this.ordersSubject.value];
        const idx = list.findIndex(item => item.id === o.id);
        
        if (idx > -1) {
          list[idx] = o;
        } else {
          o.id = 'ord-' + (1000 + list.length + 1);
          o.orderDate = new Date();
          o.status = 'Pending';
          o.statusHistory = [
            { status: 'Pending', updatedAt: new Date(), updatedBy: 'System' }
          ];
          list.push(o);

          // Auto-deduct stock
          const products = [...this.productsSubject.value];
          o.items.forEach(item => {
            const product = products.find(p => p.id === item.productId);
            if (product) {
              product.stock = Math.max(0, product.stock - item.quantity);
            }
          });
          this.productsSubject.next(products);
          this.sync('products', products);
        }

        this.ordersSubject.next(list);
        this.sync('orders', list);
        return o;
      })
    );
  }

  public updateOrderStatus(id: string, status: OrderStatus, updatedBy: string): Observable<Order> {
    return of({ id, status, updatedBy }).pipe(
      delay(this.delayTime),
      map(params => {
        const list = [...this.ordersSubject.value];
        const idx = list.findIndex(item => item.id === params.id);
        if (idx === -1) {
          throw new Error('Order not found');
        }
        const order = { ...list[idx] };
        order.status = params.status;
        order.statusHistory = [
          ...order.statusHistory,
          { status: params.status, updatedAt: new Date(), updatedBy: params.updatedBy }
        ];
        list[idx] = order;
        this.ordersSubject.next(list);
        this.sync('orders', list);
        return order;
      })
    );
  }

  // --- ACTIVITIES ---
  public getActivities(): Observable<RecentActivity[]> {
    return this.activitiesSubject.asObservable().pipe(take(1), delay(this.delayTime));
  }
}
