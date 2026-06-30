import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  constructor(private snackBar: MatSnackBar) {}

  private show(message: string, panelClass: string, duration: number = 3000) {
    const config: MatSnackBarConfig = {
      duration,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: [panelClass]
    };
    this.snackBar.open(message, 'Close', config);
  }

  public success(message: string) {
    this.show(message, 'toast-success');
  }

  public error(message: string) {
    this.show(message, 'toast-error');
  }

  public info(message: string) {
    this.show(message, 'toast-info');
  }
}
