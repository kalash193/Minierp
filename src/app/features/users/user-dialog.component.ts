import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { User } from '../../core/models/user.model';

export interface UserDialogData {
  user?: User;
  existingEmails: string[];
}

@Component({
  selector: 'app-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSlideToggleModule
  ],
  templateUrl: './user-dialog.component.html',
  styles: [`
    .dialog-form {
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-width: 320px;
      padding-top: 10px;
    }
    .toggle-row {
      margin-top: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .full-width {
      width: 100%;
    }
  `]
})
export class UserDialogComponent implements OnInit {
  public userForm!: FormGroup;
  public isEditMode = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<UserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UserDialogData
  ) {}

  ngOnInit() {
    this.isEditMode = !!this.data.user;
    this.initForm();
  }

  private initForm() {
    const u = this.data.user;
    this.userForm = this.fb.group({
      id: [u?.id || ''],
      name: [u?.name || '', [Validators.required, Validators.minLength(3)]],
      email: [
        { value: u?.email || '', disabled: this.isEditMode },
        [Validators.required, Validators.email, this.emailUniqueValidator.bind(this)]
      ],
      role: [u?.role || 'Staff', [Validators.required]],
      isActive: [u?.isActive !== undefined ? u.isActive : true]
    });
  }

  private emailUniqueValidator(control: any) {
    if (this.isEditMode) return null;
    const value = (control.value || '').trim().toLowerCase();
    if (this.data.existingEmails.includes(value)) {
      return { emailTaken: true };
    }
    return null;
  }

  public onSubmit() {
    if (this.userForm.invalid) return;

    const formVal = this.userForm.getRawValue();
    const result: User = {
      ...formVal,
      name: formVal.name.trim(),
      email: formVal.email.trim().toLowerCase()
    };

    this.dialogRef.close(result);
  }

  public onCancel() {
    this.dialogRef.close();
  }
}
