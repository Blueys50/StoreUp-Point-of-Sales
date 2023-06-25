import { Component, OnInit } from '@angular/core';
import { Setting } from 'src/models/settings';
import { StorageService } from 'src/services/storage.service';
import { PaymentMethodDetailComponent } from './payment-method-detail/payment-method-detail.component';
import { FormGroup, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import {
  LoadingController,
  ModalController,
  ToastController,
} from '@ionic/angular';
import { Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { DatabaseService } from 'src/services/database.service';
import { PaymentMethod } from 'src/models/paymentMethod';
import { settings } from 'cluster';

@Component({
  selector: 'payment-method-page',
  templateUrl: './payment-method-page.component.html',
  styleUrls: ['./payment-method-page.component.scss'],
})
export class PaymentMethodPageComponent implements OnInit {
  defaultPaymentMethod: PaymentMethod;
  isArchiveList: boolean = false;
  private _subscription: Subscription;
  filterForm = new FormGroup({
    search: new FormControl(''),
  });
  showIsEmpty: boolean = true;

  constructor(
    private router: Router,
    public databaservice: DatabaseService,
    private modalController: ModalController,
    private storageService: StorageService,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {}
  paymentMethodList: PaymentMethod[] | any;

  async ngOnInit() {}

  async ionViewWillEnter() {
    this._subscription = this.filterForm.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((params) => this.filterChanged(params));
    this.paymentMethodList = await this.databaservice.getPaymentMethod(
      undefined,
      {
        isArchived: this.isArchiveList,
      }
    );
    let setting: Setting = await this.storageService.get(Setting.storageKey);
    if (setting?.defaultPaymentMethod) {
      this.defaultPaymentMethod = setting.defaultPaymentMethod;
    }
    if (this.defaultPaymentMethod?.paymentMethodName) {
      this.paymentMethodList = this.paymentMethodList.filter(
        (pm) =>
          pm.paymentMethodName != this.defaultPaymentMethod.paymentMethodName
      );
    }
  }

  async filterChanged(params?: any): Promise<void> {
    this.paymentMethodList = await this.databaservice.getPaymentMethod(
      undefined,
      {
        isArchived: this.isArchiveList,
        search: params?.search,
      }
    );
    this.paymentMethodList = this.paymentMethodList.filter(
      (pm) =>
        pm.paymentMethodName != this.defaultPaymentMethod?.paymentMethodName
    );
  }

  async setAsDefault(paymentMethod: PaymentMethod) {
    this.defaultPaymentMethod = paymentMethod;
    let setting: Setting = await this.storageService.get(Setting.storageKey);
    setting = {
      ...setting,
      defaultPaymentMethod: paymentMethod,
    };
    this.storageService.set(Setting.storageKey, setting);
    await this.loadingChange();
  }

  async archivePaymentMethod(paymentMethod: PaymentMethod) {
    paymentMethod = {
      ...paymentMethod,
      isArchived: !this.isArchiveList,
    };
    if (!this.isArchiveList) {
      let time = this.databaservice.getTime();
      paymentMethod = {
        ...paymentMethod,
        archivedDate: time as any,
      };
    }
    let message = await this.databaservice.editPaymentMethod(paymentMethod);
    if (message == 'Success') {
      this.makeToast('Success');
      await this.loadingChange();
    }
  }

  async deletePaymentMethod(paymentMethod: PaymentMethod) {
    const confirmed = confirm(
      `Are you sure you want to permanently delete ${paymentMethod.paymentMethodName}?`
    );
    if (confirmed) {
      let res = await this.databaservice.deletePaymentMethod(paymentMethod);
      if (res == 'Success') {
        this.makeToast('Deleted');
      }
    }
    await this.loadingChange();
  }

  async back() {
    await this.router.navigate(['/tabs/tab1/']);
  }

  async addPaymentMethod() {
    let modal = await this.modalController.create({
      component: PaymentMethodDetailComponent,
      componentProps: {
        modalTitle: 'Add New Payment Method',
      },
      cssClass: 'auto-height',
    });
    await modal.present();
    let data = await modal.onDidDismiss();
    if (data?.data) {
      this.makeToast(data.data);
      await this.loadingChange();
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
