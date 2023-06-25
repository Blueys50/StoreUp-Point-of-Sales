import { Component, Input, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { Cashier } from 'src/models/cashier';
import { Customer } from 'src/models/customer';
import { Setting } from 'src/models/settings';
import { DatabaseService } from 'src/services/database.service';
import { StorageService } from 'src/services/storage.service';

@Component({
  selector: 'customer-detail',
  templateUrl: './customer-detail.component.html',
  styleUrls: ['./customer-detail.component.scss'],
})
export class CustomerDetailComponent implements OnInit {
  @Input() modalTitle: string;
  @Input() customer: Customer;
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
      customerName: [
        this.customer?.customerName,
        [Validators.required, Validators.maxLength(255)],
      ],
      customerInfo: [this.customer?.customerInfo, []],
      customerEmail: [this.customer?.customerEmail, Validators.email],
      customerPhone: [this.customer?.customerPhone, []],
    });
  }

  async makeCustomer() {
    let customer: Customer = this.form.value;
    if (!this.customer) {
      await this.databaseService.addCustomer(customer);
      this.modalController.dismiss('Added Succesfully');
    } else {
      customer = {
        ...customer,
        customerId: this.customer.customerId,
      };
      await this.databaseService.editCustomer(customer);
      if (this.isActive) {
        let defCustomer = await this.databaseService.getCustomer(
          customer.customerId
        );
        let setting: Setting = await this.storageService.get(
          Setting.storageKey
        );
        setting = {
          ...setting,
          defaultCustomer: defCustomer[0] as any,
        };
        this.storageService.set(Setting.storageKey, setting);
      }
      this.modalController.dismiss('Edited Succesfully');
    }
  }

  cancel() {
    this.modalController.dismiss();
  }
}
