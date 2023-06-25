import { Component, Input, OnInit } from '@angular/core';
import {
  FormGroup,
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { Observable, debounceTime, distinctUntilChanged, map } from 'rxjs';
import { Cashier } from 'src/models/cashier';
import { PaymentMethod } from 'src/models/paymentMethod';
import { Setting } from 'src/models/settings';
import { DatabaseService } from 'src/services/database.service';
import { StorageService } from 'src/services/storage.service';

@Component({
  selector: 'payment-method-detail',
  templateUrl: './payment-method-detail.component.html',
  styleUrls: ['./payment-method-detail.component.scss'],
})
export class PaymentMethodDetailComponent implements OnInit {
  @Input() modalTitle: string;
  @Input() paymentMethod: PaymentMethod;
  @Input() isActive?: boolean;
  form: FormGroup;

  constructor(
    private modalController: ModalController,
    private fb: FormBuilder,
    private databaseService: DatabaseService,
    private storageService: StorageService
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      paymentMethodName: [
        this.paymentMethod?.paymentMethodName,
        [Validators.required, Validators.maxLength(255)],
      ],
    });
  }

  async checkUnique(name: any) {
    while (name.length > 0) {
      const lastChar = name[name.length - 1];
      if (
        lastChar === ' ' ||
        lastChar === '\n' ||
        lastChar === '\r' ||
        lastChar === '\t'
      ) {
        name = name.slice(0, -1);
      } else {
        break;
      }
    }
    let paymentMethod = await this.databaseService.checkPaymentNameIsUnique(
      name
    );
    return paymentMethod.length == 0;
  }

  async makePaymentMethod() {
    let paymentMethod: PaymentMethod = this.form.value;
    let paymentMethodNameUnique = await this.checkUnique(
      paymentMethod.paymentMethodName
    );
    if (paymentMethodNameUnique) {
      if (!this.paymentMethod) {
        await this.databaseService.addPaymentMethod(paymentMethod);
        this.modalController.dismiss('Added Succesfully');
      } else {
        await this.databaseService.editPaymentMethod(
          paymentMethod,
          this.paymentMethod.paymentMethodName
        );
        if (this.isActive) {
          let defPaymentMethod = await this.databaseService.getPaymentMethod(
            paymentMethod.paymentMethodName
          );
          let setting: Setting = await this.storageService.get(
            Setting.storageKey
          );
          setting = {
            ...setting,
            defaultCustomer: defPaymentMethod[0] as any,
          };
          this.storageService.set(Setting.storageKey, setting);
        }
        this.modalController.dismiss(
          'Edited Succesfully',
          paymentMethod.paymentMethodName
        );
      }
    } else {
      alert('Payment name needs to be unique.');
    }
  }

  cancel() {
    this.modalController.dismiss();
  }
}
