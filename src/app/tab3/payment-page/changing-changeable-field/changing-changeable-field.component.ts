import { Component, Input, OnInit } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { Cashier } from 'src/models/cashier';
import { Customer } from 'src/models/customer';
import { PaymentMethod } from 'src/models/paymentMethod';
import { DatabaseService } from 'src/services/database.service';

@Component({
  selector: 'changing-changeable-field',
  templateUrl: './changing-changeable-field.component.html',
  styleUrls: ['./changing-changeable-field.component.scss'],
})
export class ChangingChangeableFieldComponent implements OnInit {
  @Input() modalTitle: string;
  @Input() cashier: Cashier | any;
  @Input() paymentMethod: PaymentMethod;
  @Input() customer: Customer;
  itemList: any[] | any;
  defaultModel: any;
  filterForm = new FormGroup({
    search: new FormControl(''),
  });
  _subscription: Subscription;
  showDropdown: boolean;
  labelText: string;

  constructor(
    private modalController: ModalController,
    private databaseService: DatabaseService
  ) {}

  async ngOnInit() {
    if (this.cashier) {
      this.labelText = 'Cashier';
      this.defaultModel = this.cashier;
    } else if (this.paymentMethod) {
      this.labelText = 'Payment Method';
      this.defaultModel = this.paymentMethod;
    } else if (this.customer) {
      this.labelText = 'Customer';
      this.defaultModel = this.customer;
    }
    this._subscription = this.filterForm.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((params) => this.searchDropdown(params));
  }

  async searchDropdown(params): Promise<void> {
    if (params.search) {
      this.itemList = [];
      if (this.cashier) {
        this.itemList = await this.databaseService.getCashiers(undefined, {
          isArchived: false,
          search: params.search,
        });
      } else if (this.paymentMethod) {
        this.itemList = await this.databaseService.getPaymentMethod(undefined, {
          isArchived: false,
          search: params.search,
        });
      } else if (this.customer) {
        this.itemList = await this.databaseService.getCustomer(undefined, {
          isArchived: false,
          search: params.search,
        });
      }
      this.showDropdown = true;
    } else {
      this.showDropdown = false;
    }
  }

  selectItem(item) {
    this.defaultModel = item;
    this.filterForm.reset();
  }

  async cancel() {
    await this.modalController.dismiss();
  }

  async changeField() {
    await this.modalController.dismiss(this.defaultModel);
  }
}
