import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { forkJoin } from 'rxjs';
import { MockDbService } from '../../core/services/mock-db.service';
import { ToastService } from '../../shared/services/toast.service';
import { DataTableComponent, TableColumn } from '../../shared/components/data-table/data-table.component';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { Product } from '../../core/models/product.model';
import { Order } from '../../core/models/order.model';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonToggleModule,
    DataTableComponent,
    LoaderComponent
  ],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit {
  public isLoading = signal<boolean>(false);
  public activeReport = signal<'inventory' | 'orders'>('inventory');

  // Raw data lists
  private products = signal<Product[]>([]);
  private orders = signal<Order[]>([]);

  // Filter states
  public selectedCategory = signal<string>('All');
  public selectedStatus = signal<string>('All');
  public startDate = signal<Date | null>(null);
  public endDate = signal<Date | null>(null);

  // Dynamic Categories options
  public categories = ['All', 'Electronics', 'Furniture', 'Kitchenware', 'Office Supplies', 'Apparel'];

  // Table columns dynamic definitions
  public inventoryColumns: TableColumn[] = [
    { key: 'sku', label: 'SKU', sortable: true, type: 'text' },
    { key: 'name', label: 'Product Name', sortable: true, type: 'text' },
    { key: 'category', label: 'Category', sortable: true, type: 'text' },
    { key: 'price', label: 'Unit Price', sortable: true, type: 'currency' },
    { key: 'stock', label: 'Stock Level', sortable: true, type: 'number' },
    { key: 'totalValue', label: 'Asset Value', sortable: true, type: 'currency' }
  ];

  public ordersColumns: TableColumn[] = [
    { key: 'id', label: 'Order ID', sortable: true, type: 'text' },
    { key: 'orderDate', label: 'Date Placed', sortable: true, type: 'date' },
    { key: 'customerName', label: 'Customer Name', sortable: true, type: 'text' },
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
    },
    { key: 'itemsCount', label: 'Items Ordered', sortable: true, type: 'number' },
    { key: 'totalPrice', label: 'Gross Total', sortable: true, type: 'currency' }
  ];

  // Computed data matrices
  public inventoryReportData = computed(() => {
    let list = this.products().map(p => ({
      ...p,
      totalValue: p.price * p.stock
    }));

    const cat = this.selectedCategory();
    if (cat !== 'All') {
      list = list.filter(p => p.category.toLowerCase() === cat.toLowerCase());
    }
    return list;
  });

  public ordersReportData = computed(() => {
    let list = this.orders().map(o => ({
      ...o,
      itemsCount: o.items.reduce((sum, item) => sum + item.quantity, 0)
    }));

    const status = this.selectedStatus();
    if (status !== 'All') {
      list = list.filter(o => o.status === status);
    }

    const start = this.startDate();
    if (start) {
      start.setHours(0, 0, 0, 0);
      list = list.filter(o => o.orderDate.getTime() >= start.getTime());
    }

    const end = this.endDate();
    if (end) {
      end.setHours(23, 59, 59, 999);
      list = list.filter(o => o.orderDate.getTime() <= end.getTime());
    }

    return list;
  });

  // Aggregate statistics selectors
  public totalSKUValuation = computed(() => {
    return this.inventoryReportData().reduce((acc, p) => acc + p.totalValue, 0);
  });
  
  public totalStockUnits = computed(() => {
    return this.inventoryReportData().reduce((acc, p) => acc + p.stock, 0);
  });

  public totalSalesRevenue = computed(() => {
    return this.ordersReportData().reduce((acc, o) => acc + o.totalPrice, 0);
  });

  public totalProductsOrdered = computed(() => {
    return this.ordersReportData().reduce((acc, o) => acc + o.itemsCount, 0);
  });

  constructor(
    private mockDb: MockDbService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.loadReportsData();
  }

  public onReportToggle() {
    this.resetFilters();
  }

  public resetFilters() {
    this.selectedCategory.set('All');
    this.selectedStatus.set('All');
    this.startDate.set(null);
    this.endDate.set(null);
  }

  private loadReportsData() {
    this.isLoading.set(true);
    forkJoin({
      products: this.mockDb.getProducts(),
      orders: this.mockDb.getOrders()
    }).subscribe({
      next: (res) => {
        this.products.set(res.products);
        this.orders.set(res.orders);
        this.isLoading.set(false);
      },
      error: () => {
        this.toast.error('Failed to load reporting databases.');
        this.isLoading.set(false);
      }
    });
  }

  public exportToCSV() {
    const reportType = this.activeReport();
    let csvContent = '';

    if (reportType === 'inventory') {
      const data = this.inventoryReportData();
      if (data.length === 0) {
        this.toast.error('No inventory data to export.');
        return;
      }
      
      const headers = ['SKU', 'Product Name', 'Category', 'Unit Price', 'Stock Level', 'Asset Value'];
      csvContent += headers.join(',') + '\r\n';

      data.forEach(item => {
        const row = [
          this.escapeCSV(item.sku),
          this.escapeCSV(item.name),
          this.escapeCSV(item.category),
          item.price.toFixed(2),
          item.stock,
          item.totalValue.toFixed(2)
        ];
        csvContent += row.join(',') + '\r\n';
      });
    } else {
      const data = this.ordersReportData();
      if (data.length === 0) {
        this.toast.error('No sales data to export.');
        return;
      }

      const headers = ['Order ID', 'Date Placed', 'Customer Name', 'Customer Email', 'Status', 'Items Ordered', 'Invoice Total'];
      csvContent += headers.join(',') + '\r\n';

      data.forEach(item => {
        const row = [
          this.escapeCSV(item.id),
          item.orderDate.toLocaleDateString(),
          this.escapeCSV(item.customerName),
          this.escapeCSV(item.customerEmail),
          this.escapeCSV(item.status),
          item.itemsCount,
          item.totalPrice.toFixed(2)
        ];
        csvContent += row.join(',') + '\r\n';
      });
    }

    // Trigger download Blob
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const filename = `${reportType}_report_${new Date().toISOString().slice(0, 10)}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    this.toast.success(`Exported ${reportType} report to CSV successfully.`);
  }

  private escapeCSV(val: any): string {
    if (val === null || val === undefined) return '';
    const valStr = String(val);
    if (valStr.includes(',') || valStr.includes('"') || valStr.includes('\n')) {
      return `"${valStr.replace(/"/g, '""')}"`;
    }
    return valStr;
  }
}
