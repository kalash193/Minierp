import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MockDbService } from '../../core/services/mock-db.service';
import { ToastService } from '../../shared/services/toast.service';
import { AuthService } from '../../core/auth/auth.service';
import { DataTableComponent, TableColumn } from '../../shared/components/data-table/data-table.component';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { UserDialogComponent } from './user-dialog.component';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    DataTableComponent,
    LoaderComponent
  ],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  public isLoading = signal<boolean>(false);
  public rawUsers = signal<User[]>([]);

  // Columns definition
  public columns: TableColumn[] = [
    { key: 'name', label: 'Name', sortable: true, type: 'text' },
    { key: 'email', label: 'Email Address', sortable: true, type: 'text' },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      type: 'badge',
      badgeClassMap: (val: any) => {
        if (val === 'Admin') return 'badge-success';
        return 'badge-info';
      }
    },
    {
      key: 'statusLabel',
      label: 'Status',
      sortable: false,
      type: 'badge',
      badgeClassMap: (val: any) => {
        if (val === 'Active') return 'badge-success';
        return 'badge-error';
      }
    }
  ];

  // Calculated values
  public displayUsers = computed(() => {
    return this.rawUsers().map(u => ({
      ...u,
      statusLabel: u.isActive ? 'Active' : 'Disabled'
    }));
  });

  constructor(
    private mockDb: MockDbService,
    private authService: AuthService,
    private toast: ToastService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  private loadUsers() {
    this.isLoading.set(true);
    this.mockDb.getUsers().subscribe({
      next: (users) => {
        this.rawUsers.set(users);
        this.isLoading.set(false);
      },
      error: () => {
        this.toast.error('Failed to query users database.');
        this.isLoading.set(false);
      }
    });
  }

  public openUserDialog(user?: User) {
    const existingEmails = this.rawUsers()
      .filter(u => u.id !== user?.id)
      .map(u => u.email.toLowerCase());

    const dialogRef = this.dialog.open(UserDialogComponent, {
      width: '400px',
      data: {
        user,
        existingEmails
      }
    });

    dialogRef.afterClosed().subscribe((res: User | undefined) => {
      if (res) {
        this.saveUser(res);
      }
    });
  }

  private saveUser(user: User) {
    const activeUser = this.authService.currentUser();
    
    // Prevent self-deactivation inside dialog profile save
    if (user.id && user.id === activeUser?.id && !user.isActive) {
      this.toast.error('Security alert: You cannot deactivate your own account!');
      return;
    }

    this.isLoading.set(true);
    this.mockDb.saveUser(user).subscribe({
      next: (saved) => {
        const action = user.id ? 'Updated' : 'Registered';
        this.toast.success(`User profile of ${saved.name} saved.`);
        
        this.mockDb.logActivity(
          `${action} User account ${saved.name} (${saved.email}, Role: ${saved.role})`,
          activeUser?.name || 'System',
          'user'
        );
        this.loadUsers();
      },
      error: () => {
        this.toast.error('Failed to save user account.');
        this.isLoading.set(false);
      }
    });
  }

  public onToggleUserStatus(event: { item: any, checked: boolean }) {
    const user = event.item as User;
    const checked = event.checked;
    const activeUser = this.authService.currentUser();

    // Prevent deactivating self
    if (user.id === activeUser?.id && !checked) {
      this.toast.error('Security alert: You cannot deactivate your own account!');
      this.loadUsers(); // Refresh table status to reset switch UI
      return;
    }

    this.isLoading.set(true);
    const updatedUser: User = {
      ...user,
      isActive: checked
    };

    this.mockDb.saveUser(updatedUser).subscribe({
      next: (saved) => {
        const statusText = checked ? 'Activated' : 'Deactivated';
        this.toast.success(`User ${saved.name} was ${statusText.toLowerCase()}.`);
        
        this.mockDb.logActivity(
          `${checked ? 'Activated' : 'Deactivated'} User account ${saved.name} (${saved.email})`,
          activeUser?.name || 'System',
          'user'
        );
        this.loadUsers();
      },
      error: () => {
        this.toast.error('Failed to update user account status.');
        this.isLoading.set(false);
      }
    });
  }

  // Get table actions configuration
  public getTableActions() {
    return {
      edit: true,
      toggle: true,
      toggleCheckedField: 'isActive',
      toggleTooltip: 'Toggle active status'
    };
  }
}
