import { Cashier } from './cashier';
import { Customer } from './customer';
import { PaymentMethod } from './paymentMethod';

export interface Setting {
  activeCashier?: Cashier;
  defaultCustomer?: Customer;
  defaultPaymentMethod?: PaymentMethod;
}

export namespace Setting {
  export const storageKey = 'settings';
}
