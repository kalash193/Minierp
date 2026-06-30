import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { forkJoin } from 'rxjs';
import { MockDbService } from '../../core/services/mock-db.service';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { RecentActivity } from '../../core/models/activity.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    NgxChartsModule,
    LoaderComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  public isLoading = signal<boolean>(false);

  // KPI States
  public totalOrders = signal<number>(0);
  public totalRevenue = signal<number>(0);
  public lowStockItems = signal<number>(0);
  public activeUsers = signal<number>(0);

  // Chart Data
  public salesTrendData: any[] = [];
  public categorySalesData: any[] = [];
  public recentActivities: RecentActivity[] = [];

  // Chart options
  public view: [number, number] = [700, 300];
  public showXAxis = true;
  public showYAxis = true;
  public gradient = false;
  public showLegend = false;
  public showXAxisLabel = false;
  public showYAxisLabel = false;
  public colorScheme: any = {
    domain: ['#0284c7', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
  };

  constructor(private mockDb: MockDbService) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  public refreshDashboard() {
    this.loadDashboardData();
  }

  private loadDashboardData() {
    this.isLoading.set(true);

    forkJoin({
      products: this.mockDb.getProducts(),
      orders: this.mockDb.getOrders(),
      users: this.mockDb.getUsers(),
      activities: this.mockDb.getActivities()
    }).subscribe({
      next: (res) => {
        // 1. Calculate KPI Values
        this.totalOrders.set(res.orders.length);
        this.totalRevenue.set(res.orders.reduce((sum, o) => sum + o.totalPrice, 0));
        this.lowStockItems.set(res.products.filter(p => p.stock <= p.minStock).length);
        this.activeUsers.set(res.users.filter(u => u.isActive).length);

        // 2. Prepare Recent Activities
        this.recentActivities = res.activities.slice(0, 5);

        // 3. Process Sales Trend Data (Group sales by Date)
        const dateSalesMap = new Map<string, number>();
        const sortedOrders = [...res.orders].sort((a, b) => a.orderDate.getTime() - b.orderDate.getTime());
        sortedOrders.forEach(o => {
          const dateStr = o.orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          dateSalesMap.set(dateStr, (dateSalesMap.get(dateStr) || 0) + o.totalPrice);
        });
        
        this.salesTrendData = [
          {
            name: 'Revenue',
            series: Array.from(dateSalesMap.entries()).map(([name, value]) => ({ name, value }))
          }
        ];

        // 4. Process Sales by Category Data
        const categorySalesMap = new Map<string, number>();
        const productCategoryMap = new Map<string, string>();
        res.products.forEach(p => productCategoryMap.set(p.id, p.category));

        res.orders.forEach(order => {
          order.items.forEach(item => {
            const category = productCategoryMap.get(item.productId) || 'Unknown';
            const cost = item.price * item.quantity;
            categorySalesMap.set(category, (categorySalesMap.get(category) || 0) + cost);
          });
        });

        this.categorySalesData = Array.from(categorySalesMap.entries()).map(([name, value]) => ({ name, value }));

        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  // Helpers for activity icons and colors
  public getActivityIcon(type: string): string {
    switch (type) {
      case 'auth': return 'vpn_key';
      case 'product': return 'inventory_2';
      case 'order': return 'shopping_cart';
      case 'user': return 'person';
      default: return 'info';
    }
  }

  public getActivityColorClass(type: string): string {
    switch (type) {
      case 'auth': return 'bg-purple';
      case 'product': return 'bg-blue';
      case 'order': return 'bg-green';
      case 'user': return 'bg-yellow';
      default: return 'bg-gray';
    }
  }
}
