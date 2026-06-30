import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from './core/auth/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  // Computed states for the view template
  public isAuthenticated = computed(() => this.authService.isAuthenticated());
  public isAdmin = computed(() => this.authService.isAdmin());
  public currentUser = computed(() => this.authService.currentUser());

  constructor(private authService: AuthService) {}

  public logout() {
    this.authService.logout();
  }

  public getAvatarInitials(name: string | undefined): string {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  }
}
