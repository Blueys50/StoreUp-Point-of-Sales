import { Component, Input, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { Customer } from 'src/models/customer';
import { Item } from 'src/models/item';
import { MultiPrices } from 'src/models/multiPrice';
import { Package } from 'src/models/package';
import { salesDetail } from 'src/models/salesDetail';
import { Setting } from 'src/models/settings';
import { wholesalePrice } from 'src/models/wholesalePrice';
import { priceValidator } from 'src/services/common.service';
import { DatabaseService } from 'src/services/database.service';
import { StorageService } from 'src/services/storage.service';

@Component({
  selector: 'payment-item-detail',
  templateUrl: './payment-item-detail.component.html',
  styleUrls: ['./payment-item-detail.component.scss'],
})
export class PaymentItemDetailComponent implements OnInit {
  @Input() modalTitle: string;
  @Input() paymentItem: salesDetail;
  @Input() isSales: boolean;
  form: FormGroup;
  multiPrice: MultiPrices[] | any;
  package: Package[] | any;
  wholesalePrice: wholesalePrice[] | any;

  constructor(
    private modalController: ModalController,
    private fb: FormBuilder,
    private databaseService: DatabaseService
  ) {}

  async ngOnInit() {
    this.form = this.fb.group({
      itemName: [
        this.paymentItem?.itemName,
        [Validators.required, Validators.maxLength(255)],
      ],
      qty: [
        this.paymentItem?.qty,
        [Validators.required, Validators.min(1), priceValidator()],
      ],
      unit: [this.paymentItem?.unit, []],
      sellingPrice: [
        this.paymentItem?.sellingPrice,
        [Validators.min(0), priceValidator()],
      ],
    });
    if (this.isSales) {
      this.multiPrice = await this.databaseService.getMultiPrice(
        this.paymentItem.itemId
      );
      this.package = await this.databaseService.getPackage(
        this.paymentItem.itemId
      );
      this.wholesalePrice = await this.databaseService.getWholesalePrice(
        this.paymentItem.itemId
      );
    }
    this.form.controls['qty'].valueChanges.subscribe((value) => {
      if (this.wholesalePrice[0]?.minimumQty <= value) {
        this.form.controls['sellingPrice'].setValue(
          this.wholesalePrice[0]?.price
        );
      }
    });
  }

  async editItem() {
    let newItem: salesDetail = this.form.value;
    let item: salesDetail = {
      ...this.paymentItem,
      ...newItem,
    };
    if (
      this.paymentItem.isCountStock &&
      this.paymentItem.stockAfter &&
      newItem.qty
    ) {
      item.stockAfter = this.paymentItem.stockAfter + 1 - newItem?.qty;
    }
    if (item.sellingPrice && item.qty) {
      item.totalPrice = item.qty * item.sellingPrice;
    }
    this.modalController.dismiss(item);
  }

  cancel() {
    this.modalController.dismiss();
  }

  remove() {
    this.modalController.dismiss('remove');
  }

  useMultiPrice(mp: MultiPrices) {
    this.form.controls['sellingPrice'].setValue(mp.price);
    this.form.markAsDirty();
  }

  usePackage(pack: Package) {
    this.form.controls['sellingPrice'].setValue(pack.packagePrice);
    this.form.controls['qty'].setValue(pack.packageQty);
    this.form.markAsDirty();
  }
}
