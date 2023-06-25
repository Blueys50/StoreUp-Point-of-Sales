import { Injectable } from '@angular/core';
import { AbstractControl, ValidatorFn, Validators } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CommonService {
  refreshTable: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  showInvoiceReport = false;
  customer: { customerName: any; customerId: any } | undefined;
  showSetting: boolean;
  showPayment: boolean;
  showStorage: boolean;
  constructor() {}
}

export function priceValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const value = control.value;

    const pattern = /^(\d+(\.\d+)?)$/;

    if (Validators.required(control) !== null || pattern.test(value)) {
      return null;
    } else {
      return { price: true };
    }
  };
}
