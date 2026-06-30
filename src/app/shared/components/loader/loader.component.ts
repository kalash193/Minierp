import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    <div *ngIf="visible" [ngClass]="{'loader-absolute': absolute, 'loader-fixed': !absolute}">
      <div class="loader-content">
        <mat-spinner diameter="50" color="primary"></mat-spinner>
        <p *ngIf="message" class="loader-message">{{ message }}</p>
      </div>
    </div>
  `,
  styles: [`
    .loader-fixed {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(255, 255, 255, 0.75);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(2px);
    }
    .loader-absolute {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.75);
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: inherit;
    }
    .loader-content {
      text-align: center;
    }
    .loader-message {
      margin-top: 15px;
      font-weight: 500;
      color: #1e293b;
      font-size: 0.95rem;
    }
  `]
})
export class LoaderComponent {
  @Input() visible: boolean = false;
  @Input() absolute: boolean = false;
  @Input() message: string = 'Loading details...';
}
