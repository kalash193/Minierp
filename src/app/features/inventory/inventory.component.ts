import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MockDbService } from '../../core/services/mock-db.service';
import { ToastService } from '../../shared/services/toast.service';
import { AuthService } from '../../core/auth/auth.service';
import { DataTableComponent, TableColumn } from '../../shared/components/data-table/data-table.component';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { ProductDialogComponent } from './product-dialog.component';
import { Product } from '../../core/models/product.model';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatDialogModule,
    DataTableComponent,
    LoaderComponent
  ],
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.css']
})
export class InventoryComponent implements OnInit {
  public isLoading = signal<boolean>(false);
  public rawProducts = signal<Product[]>([]);
  public selectedCategory = signal<string>('All');
  public categories = ['All', 'Electronics', 'Furniture', 'Kitchenware', 'Office Supplies', 'Apparel'];

  // Table Column definition
  public columns: TableColumn[] = [
    { key: 'sku', label: 'SKU', sortable: true, type: 'text' },
    { key: 'name', label: 'Product Name', sortable: true, type: 'text' },
    { key: 'category', label: 'Category', sortable: true, type: 'text' },
    { key: 'price', label: 'Unit Price', sortable: true, type: 'currency' },
    { key: 'stock', label: 'Stock', sortable: true, type: 'number' },
    {
      key: 'status',
      label: 'Status',
      sortable: false,
      type: 'badge',
      badgeClassMap: (val: any) => {
        if (val === 'Out of Stock') return 'badge-error';
        if (val === 'Low Stock') return 'badge-warning';
        return 'badge-success';
      }
    }
  ];

  // Calculated values mapped as signals
  public displayProducts = computed(() => {
    const list = this.rawProducts().map(p => ({
      ...p,
      status: p.stock === 0 ? 'Out of Stock' : (p.stock <= p.minStock ? 'Low Stock' : 'In Stock')
    }));

    const cat = this.selectedCategory();
    if (cat === 'All') return list;
    return list.filter(p => p.category.toLowerCase() === cat.toLowerCase());
  });

  public totalSKUCount = computed(() => this.rawProducts().length);
  public lowStockCount = computed(() => this.rawProducts().filter(p => p.stock <= p.minStock && p.stock > 0).length);
  public outStockCount = computed(() => this.rawProducts().filter(p => p.stock === 0).length);
  public isAdmin = computed(() => this.authService.isAdmin());

  constructor(
    private mockDb: MockDbService,
    private authService: AuthService,
    private toast: ToastService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadProducts();
  }

  private loadProducts() {
    this.isLoading.set(true);
    this.mockDb.getProducts().subscribe({
      next: (products) => {
        this.rawProducts.set(products);
        this.isLoading.set(false);
      },
      error: () => {
        this.toast.error('Failed to query products from inventory.');
        this.isLoading.set(false);
      }
    });
  }

  public openProductDialog(product?: Product) {
    const dataSkus = this.rawProducts()
      .filter(p => p.id !== product?.id)
      .map(p => p.sku);

    const dialogRef = this.dialog.open(ProductDialogComponent, {
      width: '450px',
      data: {
        product,
        existingSkus: dataSkus
      }
    });

    dialogRef.afterClosed().subscribe((res: Product | undefined) => {
      if (res) {
        this.saveProduct(res);
      }
    });
  }

  private saveProduct(product: Product) {
    this.isLoading.set(true);
    this.mockDb.saveProduct(product).subscribe({
      next: (saved) => {
        const user = this.authService.currentUser();
        const action = product.id ? 'Updated' : 'Created';
        this.toast.success(`Product ${saved.name} saved successfully.`);
        
        this.mockDb.logActivity(
          `${action} Product ${saved.name} (SKU: ${saved.sku}, Stock: ${saved.stock})`,
          user?.name || 'System',
          'product'
        );
        this.loadProducts();
      },
      error: () => {
        this.toast.error('Failed to save product details.');
        this.isLoading.set(false);
      }
    });
  }

  public deleteProduct(product: Product) {
    if (confirm(`Are you sure you want to delete product "${product.name}"? This action is permanent.`)) {
      this.isLoading.set(true);
      this.mockDb.deleteProduct(product.id).subscribe({
        next: () => {
          const user = this.authService.currentUser();
          this.toast.success(`Product ${product.name} was deleted.`);
          
          this.mockDb.logActivity(
            `Deleted Product ${product.name} (SKU: ${product.sku})`,
            user?.name || 'System',
            'product'
          );
          this.loadProducts();
        },
        error: () => {
          this.toast.error('Failed to delete product.');
          this.isLoading.set(false);
        }
      });
    }
  }

  // Get table action options
  public getTableActions() {
    return {
      edit: true,
      delete: this.isAdmin()
    };
  }
}
