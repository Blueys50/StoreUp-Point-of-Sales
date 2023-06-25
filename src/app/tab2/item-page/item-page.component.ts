import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import {
  ModalController,
  ToastController,
  LoadingController,
} from '@ionic/angular';
import { Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { Item } from 'src/models/item';
import { DatabaseService } from 'src/services/database.service';
import { ScanService } from 'src/services/scan.service';
import { CommonService } from 'src/services/common.service';

@Component({
  selector: 'item-page',
  templateUrl: './item-page.component.html',
  styleUrls: ['./item-page.component.scss'],
})
export class ItemPageComponent implements OnInit, OnDestroy {
  selectedOption: any;
  isArchiveList: boolean = false;
  private _subscription: Subscription;
  filterForm = new FormGroup({
    search: new FormControl(''),
  });
  showIsEmpty: boolean = true;
  subscriptionRefresh: Subscription;

  constructor(
    private router: Router,
    public databaservice: DatabaseService,
    private toastController: ToastController,
    private loadingCtrl: LoadingController,
    public scanService: ScanService,
    private commonService: CommonService
  ) {}
  itemList: Item[] | any;

  async ngOnInit() {
    this._subscription = this.filterForm.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((params) => this.filterChanged(params));
    this.itemList = await this.databaservice.getItems(undefined, {
      isArchived: this.isArchiveList,
    });
    this.subscriptionRefresh = this.commonService.refreshTable.subscribe(
      async () => {
        await this.loadingChange();
      }
    );
  }

  ngOnDestroy(): void {
    this.subscriptionRefresh.unsubscribe();
  }

  async filterChanged(params?: any): Promise<void> {
    this.itemList = [];
    this.itemList = await this.databaservice.getItems(undefined, {
      isArchived: this.isArchiveList,
      search: params?.search,
    });
  }

  async archiveItem(item: Item) {
    item = {
      ...item,
      isArchived: !this.isArchiveList,
    };
    if (!this.isArchiveList) {
      let time = this.databaservice.getTime();
      item = {
        ...item,
        archivedDate: time as any,
      };
    }
    let message = await this.databaservice.editItem(item);
    if (message == 'Success') {
      this.makeToast('Success');
      await this.loadingChange();
    }
  }

  async edit(item: Item) {
    const itemWrapper = {
      item: item,
    };
    await this.router.navigate(['/tabs/tab2/item-detail'], {
      state: { data: itemWrapper },
    });
  }

  async back() {
    await this.router.navigate(['/tabs/tab1/']);
  }

  async addNewItem() {
    await this.router.navigate(['/tabs/tab2/item-detail']);
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

  async scanCode() {
    let result = await this.scanService.startScanner();
    if (result) {
      this.filterForm.controls['search'].setValue(result);
    }
  }
}
