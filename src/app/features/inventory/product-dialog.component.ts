import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { Product } from '../../core/models/product.model';

export interface ProductDialogData {
  product?: Product;
  existingSkus: string[];
}

@Component({
  selector: 'app-product-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule
  ],
  templateUrl: './product-dialog.component.html',
  styles: [`
    .dialog-form {
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-width: 320px;
      padding-top: 10px;
    }
    .row-fields {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .full-width {
      width: 100%;
    }
  `]
})
export class ProductDialogComponent implements OnInit {
  public productForm!: FormGroup;
  public isEditMode = false;
  public categories = ['Electronics', 'Furniture', 'Kitchenware', 'Office Supplies', 'Apparel'];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ProductDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ProductDialogData
  ) {}

  ngOnInit() {
    this.isEditMode = !!this.data.product;
    this.initForm();
  }

  private initForm() {
    const p = this.data.product;
    this.productForm = this.fb.group({
      id: [p?.id || ''],
      sku: [
        { value: p?.sku || '', disabled: this.isEditMode },
        [
          Validators.required,
          Validators.pattern('^[a-zA-Z0-9-]{3,10}$'), // 3-10 characters/numbers/dashes
          this.skuUniqueValidator.bind(this)
        ]
      ],
      name: [p?.name || '', [Validators.required, Validators.minLength(3)]],
      price: [p?.price || '', [Validators.required, Validators.min(0.01)]],
      stock: [p?.stock !== undefined ? p.stock : '', [Validators.required, Validators.min(0)]],
      minStock: [p?.minStock !== undefined ? p.minStock : 5, [Validators.required, Validators.min(0)]],
      category: [p?.category || '', [Validators.required]]
    });
  }

  private skuUniqueValidator(control: any) {
    if (this.isEditMode) return null;
    const value = (control.value || '').trim().toUpperCase();
    if (this.data.existingSkus.includes(value)) {
      return { skuTaken: true };
    }
    return null;
  }

  public onSubmit() {
    if (this.productForm.invalid) return;
    
    // Make sure values are cast correctly
    const formVal = this.productForm.getRawValue();
    const result: Product = {
      ...formVal,
      sku: formVal.sku.trim().toUpperCase(),
      name: formVal.name.trim(),
      price: parseFloat(formVal.price),
      stock: parseInt(formVal.stock),
      minStock: parseInt(formVal.minStock)
    };

    this.dialogRef.close(result);
  }

  public onCancel() {
    this.dialogRef.close();
  }
}
