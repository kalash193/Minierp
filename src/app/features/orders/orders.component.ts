import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MockDbService } from '../../core/services/mock-db.service';
import { ToastService } from '../../shared/services/toast.service';
import { AuthService } from '../../core/auth/auth.service';
import { DataTableComponent, TableColumn } from '../../shared/components/data-table/data-table.component';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { Order, OrderItem, OrderStatus } from '../../core/models/order.model';
import { Product } from '../../core/models/product.model';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDividerModule,
    DataTableComponent,
    LoaderComponent
  ],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css']
})
export class OrdersComponent implements OnInit {
  public isLoading = signal<boolean>(false);
  public substate = signal<'list' | 'create' | 'details'>('list');

  // Datasets
  public rawOrders = signal<Order[]>([]);
  public rawProducts = signal<Product[]>([]);
  
  // Lists filters
  public statusFilter = signal<string>('All');
  public startDateFilter = signal<Date | null>(null);
  public endDateFilter = signal<Date | null>(null);

  // New order states
  public orderForm!: FormGroup;
  public cartItems = signal<OrderItem[]>([]);
  public selectedProduct = signal<Product | null>(null);
  public orderQuantity = signal<number>(1);

  // Details state
  public selectedOrder = signal<Order | null>(null);

  // Table columns
  public columns: TableColumn[] = [
    { key: 'id', label: 'Order ID', sortable: true, type: 'text' },
    { key: 'orderDate', label: 'Date Placed', sortable: true, type: 'date' },
    { key: 'customerName', label: 'Customer Name', sortable: true, type: 'text' },
    { key: 'totalPrice', label: 'Total Price', sortable: true, type: 'currency' },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      type: 'badge',
      badgeClassMap: (val: any) => {
        if (val === 'Delivered') return 'badge-success';
        if (val === 'Shipped') return 'badge-info';
        if (val === 'Processing') return 'badge-warning';
        return 'badge-neutral';
      }
    }
  ];

  // Computed values
  public displayOrders = computed(() => {
    return this.rawOrders().filter(o => {
      const matchStatus = this.statusFilter() === 'All' || o.status === this.statusFilter();
      
      let matchDate = true;
      const orderTime = o.orderDate.getTime();
      
      const start = this.startDateFilter();
      if (start) {
        start.setHours(0, 0, 0, 0);
        matchDate = matchDate && orderTime >= start.getTime();
      }
      
      const end = this.endDateFilter();
      if (end) {
        end.setHours(23, 59, 59, 999);
        matchDate = matchDate && orderTime <= end.getTime();
      }

      return matchStatus && matchDate;
    });
  });

  public grandTotal = computed(() => {
    return this.cartItems().reduce((acc, item) => acc + (item.price * item.quantity), 0);
  });

  // Top summary widgets
  public pendingCount = computed(() => this.rawOrders().filter(o => o.status === 'Pending').length);
  public processingCount = computed(() => this.rawOrders().filter(o => o.status === 'Processing').length);
  public shippedCount = computed(() => this.rawOrders().filter(o => o.status === 'Shipped').length);
  public deliveredCount = computed(() => this.rawOrders().filter(o => o.status === 'Delivered').length);

  constructor(
    private fb: FormBuilder,
    private mockDb: MockDbService,
    private authService: AuthService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.loadOrders();
    this.initOrderForm();
  }

  private loadOrders() {
    this.isLoading.set(true);
    this.mockDb.getProducts().subscribe(prods => {
      this.rawProducts.set(prods);
      this.mockDb.getOrders().subscribe({
        next: (orders) => {
          this.rawOrders.set(orders);
          this.isLoading.set(false);
        },
        error: () => {
          this.toast.error('Failed to load orders list.');
          this.isLoading.set(false);
        }
      });
    });
  }

  private initOrderForm() {
    this.orderForm = this.fb.group({
      customerName: ['', [Validators.required, Validators.minLength(3)]],
      customerEmail: ['', [Validators.required, Validators.email]]
    });
  }

  // --- SUB-STATE: LIST ACTIONS ---
  public clearFilters() {
    this.statusFilter.set('All');
    this.startDateFilter.set(null);
    this.endDateFilter.set(null);
  }

  public openOrderDetails(order: Order) {
    this.selectedOrder.set(order);
    this.substate.set('details');
  }

  // --- SUB-STATE: CREATE ACTIONS ---
  public onProductSelect(productId: string) {
    const p = this.rawProducts().find(item => item.id === productId);
    this.selectedProduct.set(p || null);
    this.orderQuantity.set(1);
  }

  public addToCart() {
    const product = this.selectedProduct();
    const quantity = this.orderQuantity();

    if (!product) return;
    if (quantity <= 0) {
      this.toast.error('Quantity must be greater than zero.');
      return;
    }

    if (quantity > product.stock) {
      this.toast.error(`Only ${product.stock} units available in stock.`);
      return;
    }

    const currentCart = [...this.cartItems()];
    const existingIdx = currentCart.findIndex(item => item.productId === product.id);

    if (existingIdx > -1) {
      const newQty = currentCart[existingIdx].quantity + quantity;
      if (newQty > product.stock) {
        this.toast.error(`Cannot add. Total cart quantity (${newQty}) exceeds stock (${product.stock}).`);
        return;
      }
      currentCart[existingIdx].quantity = newQty;
    } else {
      currentCart.push({
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity: quantity
      });
    }

    this.cartItems.set(currentCart);
    this.toast.info(`Added ${product.name} to cart.`);

    // Reset selectors
    this.selectedProduct.set(null);
    this.orderQuantity.set(1);
  }

  public removeFromCart(idx: number) {
    const currentCart = [...this.cartItems()];
    currentCart.splice(idx, 1);
    this.cartItems.set(currentCart);
  }

  public submitOrder() {
    if (this.orderForm.invalid || this.cartItems().length === 0) return;

    this.isLoading.set(true);
    const { customerName, customerEmail } = this.orderForm.value;

    const order: Order = {
      id: '', // Set by mock service
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      items: this.cartItems(),
      totalPrice: this.grandTotal(),
      orderDate: new Date(),
      status: 'Pending',
      statusHistory: []
    };

    this.mockDb.saveOrder(order).subscribe({
      next: (saved) => {
        const user = this.authService.currentUser();
        this.toast.success(`Created Invoice ${saved.id} successfully.`);
        
        this.mockDb.logActivity(
          `Placed Order ${saved.id} for ${saved.customerName} ($${saved.totalPrice.toFixed(2)})`,
          user?.name || 'System',
          'order'
        );

        // Reset state
        this.substate.set('list');
        this.cartItems.set([]);
        this.orderForm.reset();
        this.loadOrders();
      },
      error: () => {
        this.toast.error('Failed to submit order.');
        this.isLoading.set(false);
      }
    });
  }

  public cancelCreate() {
    this.substate.set('list');
    this.cartItems.set([]);
    this.orderForm.reset();
  }

  // --- SUB-STATE: DETAILS ACTIONS ---
  public getNextStatus(curr: OrderStatus): OrderStatus | null {
    switch (curr) {
      case 'Pending': return 'Processing';
      case 'Processing': return 'Shipped';
      case 'Shipped': return 'Delivered';
      default: return null;
    }
  }

  public advanceOrderStatus() {
    const order = this.selectedOrder();
    if (!order) return;

    const nextStatus = this.getNextStatus(order.status);
    if (!nextStatus) return;

    this.isLoading.set(true);
    const user = this.authService.currentUser();

    this.mockDb.updateOrderStatus(order.id, nextStatus, user?.name || 'System').subscribe({
      next: (updated) => {
        this.toast.success(`Order transitioned to ${nextStatus}.`);
        
        this.mockDb.logActivity(
          `Advanced Status of Order ${updated.id} to ${nextStatus}`,
          user?.name || 'System',
          'order'
        );

        this.selectedOrder.set(updated);
        this.loadOrders();
      },
      error: (err) => {
        this.toast.error(err.message || 'Failed to update order status.');
        this.isLoading.set(false);
      }
    });
  }

  public backToList() {
    this.substate.set('list');
    this.selectedOrder.set(null);
  }
}
