import { Component, OnInit } from '@angular/core';
import { CustomerDetailComponent } from './customer-detail/customer-detail.component';
import { FormGroup, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import {
  LoadingController,
  ModalController,
  ToastController,
} from '@ionic/angular';
import { Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { Setting } from 'src/models/settings';
import { DatabaseService } from 'src/services/database.service';
import { StorageService } from 'src/services/storage.service';
import { Customer } from 'src/models/customer';

@Component({
  selector: 'customer-page',
  templateUrl: './customer-page.component.html',
  styleUrls: ['./customer-page.component.scss'],
})
export class CustomerPageComponent implements OnInit {
  defaultCustomer: Customer;
  isArchiveList: boolean = false;
  private _subscription: Subscription;
  filterForm = new FormGroup({
    search: new FormControl(''),
  });
  showIsEmpty: boolean = true;
  hide: boolean;

  constructor(
    private router: Router,
    public databaservice: DatabaseService,
    private modalController: ModalController,
    private storageService: StorageService,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {}
  customerList: Customer[] | any;

  async ngOnInit() {}

  async ionViewWillEnter() {
    this._subscription = this.filterForm.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe(async (params) => {
        await this.filterChanged(params);
      });
    this.customerList = await this.databaservice.getCustomer(undefined, {
      isArchived: this.isArchiveList,
    });
    let setting: Setting = await this.storageService.get(Setting.storageKey);
    if (setting?.defaultCustomer) {
      this.defaultCustomer = setting.defaultCustomer;
    }
    if (this.defaultCustomer?.customerId) {
      this.customerList = this.customerList.filter(
        (c) => c.customerId != this.defaultCustomer.customerId
      );
    }
  }

  async filterChanged(params?: any): Promise<void> {
    this.customerList = [];
    let customerList: any = await this.databaservice.getCustomer(undefined, {
      isArchived: this.isArchiveList,
      search: params?.search,
    });
    this.customerList = customerList.filter(
      (c) => c.customerId != this.defaultCustomer.customerId
    );
  }

  async setAsDefault(customer: Customer) {
    this.defaultCustomer = customer;
    let setting: Setting = await this.storageService.get(Setting.storageKey);
    setting = {
      ...setting,
      defaultCustomer: customer,
    };
    this.storageService.set(Setting.storageKey, setting);
    await this.loadingChange();
  }

  async archiveCustomer(customer: Customer) {
    customer = {
      ...customer,
      isArchived: !this.isArchiveList,
    };
    if (!this.isArchiveList) {
      let time = this.databaservice.getTime();
      customer = {
        ...customer,
        archivedDate: time as any,
      };
    }
    let message = await this.databaservice.editCustomer(customer);
    if (message == 'Success') {
      this.makeToast('Success');
      await this.loadingChange();
    }
  }

  async edit(customer: Customer, isActive?: boolean) {
    let modal = await this.modalController.create({
      component: CustomerDetailComponent,
      componentProps: {
        modalTitle: 'Edit Customer',
        customer: customer,
        isActive: isActive,
      },
      cssClass: 'auto-height',
    });
    await modal.present();
    let data = await modal.onDidDismiss();
    if (data?.data) {
      this.makeToast(data.data);
      if (isActive) {
        let defaultCustomer = await this.databaservice.getCustomer(
          customer.customerId
        );
        this.defaultCustomer = defaultCustomer[0] as any;
      }
      await this.loadingChange();
    }
  }

  async back() {
    await this.router.navigate(['/tabs/tab1/']);
  }

  async addNewCustomer() {
    let modal = await this.modalController.create({
      component: CustomerDetailComponent,
      componentProps: {
        modalTitle: 'Add New Customer',
      },
      cssClass: 'auto-height',
    });
    await modal.present();
    let data = await modal.onDidDismiss();
    if (data?.data) {
      this.makeToast(data.data);
      await this.filterChanged(this.filterForm.value);
    }
  }

  async changeIsArchived() {
    let loading = await this.loadingController.create({});
    await loading.present();
    this.showIsEmpty = false;
    this.isArchiveList = !this.isArchiveList;
    await this.filterChanged(this.filterForm.value);
    await loading.dismiss();
    this.showIsEmpty = true;
  }

  async makeToast(message) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      buttons: [{ text: 'DONE', role: 'cancel' }],
    });
    toast.present();
  }

  preventChangingPage(event: Event) {
    event.stopPropagation();
  }

  async loadingChange() {
    let loading = await this.loadingController.create({});
    await loading.present();
    await this.filterChanged(this.filterForm.value);
    await loading.dismiss();
  }
}
