import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Route, Router } from '@angular/router';
import {
  AlertController,
  LoadingController,
  ModalController,
  PopoverController,
  ToastController,
} from '@ionic/angular';
import { Cashier } from 'src/models/cashier';
import { DatabaseService } from 'src/services/database.service';
import { CashierDetailComponent } from './cashier-detail/cashier-detail.component';
import { StorageService } from 'src/services/storage.service';
import { Setting } from 'src/models/settings';
import { Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'cashier-page',
  templateUrl: './cashier-page.component.html',
  styleUrls: ['./cashier-page.component.scss'],
})
export class CashierPageComponent implements OnInit {
  selectedOption: any;
  activeCashier: Cashier;
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
    private loadingCtrl: LoadingController,
    private alertController: AlertController
  ) {}
  cashierList: Cashier[] | any;
  filteredCashierList: Cashier[];

  async ngOnInit() {}

  async ionViewWillEnter() {
    this._subscription = this.filterForm.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((params) => this.filterChanged(params));
    this.cashierList = await this.databaservice.getCashiers(undefined, {
      isArchived: this.isArchiveList,
    });
    let setting: Setting = await this.storageService.get(Setting.storageKey);
    if (setting?.activeCashier) {
      this.activeCashier = setting.activeCashier;
    }
    if (this.activeCashier?.cashierId) {
      this.cashierList = this.cashierList.filter(
        (c) => c.cashierId != this.activeCashier.cashierId
      );
    }
  }

  async filterChanged(
    params?: any,
    newwActiveCashier?: Cashier,
    time?
  ): Promise<void> {
    if (newwActiveCashier) {
      let login: Cashier = {
        ...newwActiveCashier,
        lastLogin: time as any,
      };
      await this.databaservice.editCashier(login);
    }
    this.cashierList = [];
    this.cashierList = await this.databaservice.getCashiers(undefined, {
      isArchived: this.isArchiveList,
      search: params?.search,
    });
    if (newwActiveCashier) {
      this.activeCashier = this.cashierList.filter(
        (c) => c.cashierId == newwActiveCashier.cashierId
      )[0];
    }
    this.cashierList = this.cashierList.filter(
      (c) => c.cashierId != this.activeCashier.cashierId
    );
  }

  async setAsActive(cashier: Cashier) {
    if (cashier.pin) {
      const alert = await this.alertController.create({
        header: 'Login',
        message: 'Please enter the new active cashier PIN',
        inputs: [
          {
            name: 'pin',
            type: 'number',
            placeholder: 'PIN',
          },
        ],
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
            handler: () => {},
          },
          {
            text: 'Confirm',
            handler: (data) => {
              if (data.pin == cashier.pin) {
                this.changeActive(cashier);
              } else {
                this.makeToast('Wrong Pin');
              }
            },
          },
        ],
      });
      await alert.present();
    } else {
      this.changeActive(cashier);
    }
  }

  async changeActive(cashier) {
    let time = this.databaservice.getTime();
    if (this.activeCashier) {
      let logout: Cashier = {
        ...this.activeCashier,
        lastLogout: time as any,
      };
      await this.databaservice.editCashier(logout);
    }
    this.activeCashier = cashier;
    await this.loadingChange();
    let setting: Setting = await this.storageService.get(Setting.storageKey);
    setting = {
      ...setting,
      activeCashier: cashier,
    };
    this.storageService.set(Setting.storageKey, setting);
  }

  async archiveCashier(cashier: Cashier) {
    cashier = {
      ...cashier,
      isArchived: !this.isArchiveList,
    };
    if (!this.isArchiveList) {
      let time = this.databaservice.getTime();
      cashier = {
        ...cashier,
        archivedDate: time as any,
      };
    }
    let message = await this.databaservice.editCashier(cashier);
    if (message == 'Success') {
      this.makeToast('Success');
      await this.loadingChange();
    }
  }

  async edit(cashier: Cashier, isActive?: boolean) {
    let modal = await this.modalController.create({
      component: CashierDetailComponent,
      componentProps: {
        modalTitle: 'Edit Cashier',
        cashier: cashier,
        isActive: isActive,
      },
      cssClass: 'auto-height',
    });
    await modal.present();
    let data = await modal.onDidDismiss();
    if (data?.data) {
      this.makeToast(data.data);
      if (isActive) {
        let activeCashier = await this.databaservice.getCashiers(
          cashier.cashierId
        );
        this.activeCashier = activeCashier[0] as any;
      }
      await this.loadingChange();
    }
  }

  async back() {
    await this.router.navigate(['/tabs/tab1/']);
  }

  async addNewCashier() {
    let modal = await this.modalController.create({
      component: CashierDetailComponent,
      componentProps: {
        modalTitle: 'Add New Cashier',
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
    let loading = await this.loadingCtrl.create({});
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
    let loading = await this.loadingCtrl.create({});
    await loading.present();
    await this.filterChanged(this.filterForm.value);
    await loading.dismiss();
  }
}
