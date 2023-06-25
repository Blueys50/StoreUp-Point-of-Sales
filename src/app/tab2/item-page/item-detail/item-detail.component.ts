import { Component, OnInit } from '@angular/core';
import {
  FormGroup,
  FormControl,
  FormBuilder,
  Validators,
  ValidatorFn,
  AbstractControl,
  AsyncValidatorFn,
  ValidationErrors,
} from '@angular/forms';
import { Router } from '@angular/router';
import {
  ModalController,
  ToastController,
  LoadingController,
} from '@ionic/angular';
import { Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { Customer } from 'src/models/customer';
import { Item } from 'src/models/item';
import { Setting } from 'src/models/settings';
import { CommonService, priceValidator } from 'src/services/common.service';
import { DatabaseService } from 'src/services/database.service';
import { ScanService } from 'src/services/scan.service';
import { StorageService } from 'src/services/storage.service';
import { MultiPriceComponent } from './multi-price/multi-price.component';
import { MultiPrices } from 'src/models/multiPrice';
import { Package } from 'src/models/package';
import { PackageComponent } from './package/package.component';
import { wholesalePrice } from 'src/models/wholesalePrice';
import { WholesalePriceComponent } from './wholesale-price/wholesale-price.component';

@Component({
  selector: 'item-detail',
  templateUrl: './item-detail.component.html',
  styleUrls: ['./item-detail.component.scss'],
})
export class ItemDetailComponent implements OnInit {
  defaultCustomer: Customer;
  isArchiveList: boolean = false;
  private _subscription: Subscription;
  filterForm = new FormGroup({
    search: new FormControl(''),
  });
  showIsEmpty: boolean = true;
  hide: boolean;
  item: Item | any;
  form: FormGroup;
  itemId: number;
  multiPrice: MultiPrices[] | any;
  package: Package[] | any;
  wholesalePrice: any | wholesalePrice[];
  refreshTable: boolean;

  constructor(
    private router: Router,
    public databaservice: DatabaseService,
    private modalController: ModalController,
    private toastController: ToastController,
    private fb: FormBuilder,
    public scanService: ScanService,
    private commonService: CommonService
  ) {}

  async ngOnInit() {}

  async ionViewWillEnter() {
    let itemWrapper = history.state.data;
    if (itemWrapper?.item) {
      let res = await this.databaservice.getItems(itemWrapper.item.itemId);
      this.item = res[0];
    }
    this.form = this.fb.group({
      itemName: [
        this.item?.itemName,
        [Validators.required, Validators.maxLength(255)],
      ],
      itemCode: [this.item?.itemCode, [Validators.maxLength(255)]],
      buyingPrice: [
        this.item?.buyingPrice,
        [Validators.min(0), priceValidator()],
      ],
      sellingPrice: [
        this.item?.sellingPrice,
        [Validators.required, Validators.min(0), priceValidator()],
      ],
      stock: [this.item?.stock ? this.item.stock : 0, [Validators.min(0)]],
      isCountStock: [this.item?.isCountStock ? true : false, []],
      unitName: [this.item?.unitName, [Validators.maxLength(25)]],
    });
    if (this.item?.itemId) {
      this.multiPrice = await this.databaservice.getMultiPrice(
        this.item.itemId
      );
      this.package = await this.databaservice.getPackage(this.item.itemId);
      this.wholesalePrice = await this.databaservice.getWholesalePrice(
        this.item.itemId
      );
    }
  }

  ionViewDidLeave() {
    this.item = {};
    this.multiPrice = [];
    this.package = [];
    this.wholesalePrice = [];
    if (this.refreshTable) {
      this.commonService.refreshTable.next(this.item.itemId);
    }
  }

  async back() {
    await this.router.navigate(['/tabs/tab2/']);
  }

  async addMultiPrice(multiPrice?: MultiPrices) {
    let modal = await this.modalController.create({
      component: MultiPriceComponent,
      componentProps: {
        modalTitle: multiPrice ? 'Edit multi pricing' : 'Add new multi pricing',
        itemId: this.item.itemId,
        multiPrice: multiPrice,
      },
      cssClass: 'auto-height',
    });
    await modal.present();
    let data = await modal.onDidDismiss();
    if (data?.data) {
      this.makeToast(data.data);
      this.multiPrice = [];
      this.multiPrice = await this.databaservice.getMultiPrice(
        this.item.itemId
      );
    }
  }

  async addPackage(pack?: Package) {
    let modal = await this.modalController.create({
      component: PackageComponent,
      componentProps: {
        modalTitle: pack ? 'Edit Package' : 'Add new package',
        itemId: this.item.itemId,
        package: pack,
      },
      cssClass: 'auto-height',
    });
    await modal.present();
    let data = await modal.onDidDismiss();
    if (data?.data) {
      this.makeToast(data.data);
      this.package = [];
      this.package = await this.databaservice.getPackage(this.item.itemId);
    }
  }

  async addWholesalePrice(wp?: wholesalePrice) {
    let modal = await this.modalController.create({
      component: WholesalePriceComponent,
      componentProps: {
        modalTitle: wp ? 'Edit wholesale price' : 'Add new wholesale price',
        itemId: this.item.itemId,
        wholesalePrice: wp,
      },
      cssClass: 'auto-height',
    });
    await modal.present();
    let data = await modal.onDidDismiss();
    if (data?.data) {
      this.makeToast(data.data);
      this.wholesalePrice = [];
      this.wholesalePrice = await this.databaservice.getWholesalePrice(
        this.item.itemId
      );
    }
  }

  async deleteMultiPrice(mp: MultiPrices) {
    let res = await this.databaservice.deleteMultiPrice(mp);
    if (res == 'Success') {
      this.multiPrice = [];
      this.multiPrice = await this.databaservice.getMultiPrice(
        this.item.itemId
      );
      await this.makeToast('Deleted Succesfully');
    }
  }

  async deletePackage(mp: MultiPrices) {
    let res = await this.databaservice.deletePackage(mp);
    if (res == 'Success') {
      this.package = [];
      this.package = await this.databaservice.getPackage(this.item.itemId);
      await this.makeToast('Deleted Succesfully');
    }
  }

  async deleteWholesalePrice(wp: wholesalePrice) {
    let res = await this.databaservice.deleteWholesalePrice(wp);
    if (res == 'Success') {
      this.wholesalePrice = [];
      this.wholesalePrice = await this.databaservice.getWholesalePrice(
        this.item.itemId
      );
      await this.makeToast('Deleted Succesfully');
    }
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

  async makeItem() {
    let item: Item = this.form.value;
    if (!item.isCountStock) {
      delete item.stock;
    } else if ((item.stock as any) == '') {
      item.stock = 0;
    }
    if (this.item?.itemId) {
      item = {
        ...item,
        itemId: this.item.itemId,
      };
      await this.databaservice.editItem(item);
      await this.makeToast('Item Updated');
    } else {
      let res: number = await this.databaservice.addItem(item);
      if (res) {
        let res2 = await this.databaservice.getItems(res);
        this.item = res2[0];
      }
      await this.makeToast('Item Added');
    }
    this.refreshTable = true;
  }

  async cancel() {
    await this.back();
  }

  async scan() {
    let result = await this.scanService.startScanner();
    if (result) {
      this.form.controls['itemCode'].setValue(result);
      this.form.controls['itemCode'].markAsDirty();
    }
  }
}
