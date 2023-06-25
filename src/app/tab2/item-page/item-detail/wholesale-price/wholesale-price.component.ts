import { Component, Input, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { Package } from 'src/models/package';
import { wholesalePrice } from 'src/models/wholesalePrice';
import { priceValidator } from 'src/services/common.service';
import { DatabaseService } from 'src/services/database.service';

@Component({
  selector: 'app-wholesale-price',
  templateUrl: './wholesale-price.component.html',
  styleUrls: ['./wholesale-price.component.scss'],
})
export class WholesalePriceComponent implements OnInit {
  @Input() modalTitle: string;
  @Input() wholesalePrice: wholesalePrice;
  @Input() itemId?: number;
  form: FormGroup;

  constructor(
    private modalController: ModalController,
    private fb: FormBuilder,
    private databaseService: DatabaseService
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      price: [
        this.wholesalePrice?.price,
        [Validators.required, Validators.min(0), priceValidator()],
      ],
      minimumQty: [
        this.wholesalePrice?.minimumQty,
        [Validators.required, Validators.min(0)],
      ],
    });
  }

  async makeWholeasalePrice() {
    let wholesalePrice: wholesalePrice = this.form.value;
    wholesalePrice = {
      ...wholesalePrice,
      itemId: this.itemId,
    };
    if (!this.wholesalePrice) {
      await this.databaseService.addWholesalePrice(wholesalePrice);
      this.modalController.dismiss('Added Succesfully');
    } else {
      wholesalePrice = {
        ...wholesalePrice,
        wholesalePriceId: this.wholesalePrice.wholesalePriceId,
      };
      await this.databaseService.editWholesalePrice(wholesalePrice);
      this.modalController.dismiss('Edited Succesfully');
    }
  }

  cancel() {
    this.modalController.dismiss();
  }
}
