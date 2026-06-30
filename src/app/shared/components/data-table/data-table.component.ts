import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  ViewChild,
  AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule, MatSlideToggleChange } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  type?: 'text' | 'currency' | 'date' | 'badge' | 'number';
  badgeClassMap?: (val: any) => string;
}

export interface TableActions {
  edit?: boolean;
  delete?: boolean;
  details?: boolean;
  toggle?: boolean;
  toggleCheckedField?: string;
  toggleTooltip?: string;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatTooltipModule
  ],
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.css']
})
export class DataTableComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() data: any[] = [];
  @Input() columns: TableColumn[] = [];
  @Input() actions: TableActions = {};
  @Input() searchPlaceholder: string = 'Search...';
  @Input() pageSizeOptions: number[] = [5, 10, 20];
  @Input() defaultPageSize: number = 5;

  @Output() edit = new EventEmitter<any>();
  @Output() delete = new EventEmitter<any>();
  @Output() details = new EventEmitter<any>();
  @Output() toggle = new EventEmitter<{ item: any, checked: boolean }>();

  public dataSource = new MatTableDataSource<any>([]);
  public displayedColumns: string[] = [];
  public filterValue: string = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit() {
    this.updateDisplayedColumns();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data']) {
      this.dataSource.data = this.data;
    }
    if (changes['columns'] || changes['actions']) {
      this.updateDisplayedColumns();
    }
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  private updateDisplayedColumns() {
    this.displayedColumns = this.columns.map(c => c.key);
    if (this.actions.edit || this.actions.delete || this.actions.details || this.actions.toggle) {
      this.displayedColumns.push('actions');
    }
  }

  public applyFilter(event: Event) {
    const filterVal = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterVal.trim().toLowerCase();
    
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  public onToggleChange(event: MatSlideToggleChange, element: any) {
    this.toggle.emit({ item: element, checked: event.checked });
  }

  // Helper getters to evaluate styling cleanly in class code
  public getBadgeClass(col: TableColumn, val: any): string {
    if (col.badgeClassMap) {
      return col.badgeClassMap(val);
    }
    return 'badge-neutral';
  }

  public getToggleState(element: any): boolean {
    const field = this.actions.toggleCheckedField || 'isActive';
    return !!element[field];
  }
}
