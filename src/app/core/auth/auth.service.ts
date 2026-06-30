import { Injectable, signal, computed } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, map, tap } from 'rxjs/operators';
import { User } from '../models/user.model';
import { MockDbService } from '../services/mock-db.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'minierp_token';
  
  // State represented as a Signal
  public currentUser = signal<User | null>(null);

  // Computed selector flags
  public isAuthenticated = computed(() => this.currentUser() !== null);
  public isAdmin = computed(() => this.currentUser()?.role === 'Admin');

  constructor(
    private mockDb: MockDbService,
    private router: Router
  ) {
    this.checkToken();
  }

  private checkToken() {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (token) {
      const parts = token.split('-');
      if (parts.length >= 3) {
        const id = parts.slice(2).join('-');
        this.mockDb.getUsers().subscribe(users => {
          const user = users.find(u => u.id === id);
          if (user && user.isActive) {
            this.currentUser.set(user);
          } else {
            this.logout();
          }
        });
      }
    }
  }

  public login(email: string, password: string): Observable<User> {
    return this.mockDb.getUsers().pipe(
      delay(600),
      map(users => {
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!user) {
          throw new Error('Invalid email or password.');
        }
        if (!user.isActive) {
          throw new Error('Account deactivated. Please contact your system administrator.');
        }

        // Hardcoded password verification
        const validPassword =
          (user.role === 'Admin' && password === 'adminpassword') ||
          (user.role === 'Staff' && password === 'staffpassword');

        if (!validPassword) {
          throw new Error('Invalid email or password.');
        }

        return user;
      }),
      tap(user => {
        const fakeToken = `fake-jwt-${user.role.toLowerCase()}-${user.id}`;
        localStorage.setItem(this.TOKEN_KEY, fakeToken);
        this.currentUser.set(user);
        this.mockDb.logActivity(`User ${user.email} logged in`, user.name, 'auth');
      })
    );
  }

  public logout(): void {
    const user = this.currentUser();
    if (user) {
      this.mockDb.logActivity(`User ${user.email} logged out`, user.name, 'auth');
    }
    localStorage.removeItem(this.TOKEN_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }
}
