import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    const requiredRole = route.data?.['role'] as string;
    if (requiredRole === 'Admin' && !authService.isAdmin()) {
      // User is authenticated but lacks required admin access
      router.navigate(['/dashboard']);
      return false;
    }
    return true;
  }

  // Not authenticated, redirect to login
  router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
  return false;
};
