import { Component, Input, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { Customer } from 'src/models/customer';
import { MultiPrices } from 'src/models/multiPrice';
import { Setting } from 'src/models/settings';
import { priceValidator } from 'src/services/common.service';
import { DatabaseService } from 'src/services/database.service';
import { StorageService } from 'src/services/storage.service';

@Component({
  selector: 'multi-price',
  templateUrl: './multi-price.component.html',
  styleUrls: ['./multi-price.component.scss'],
})
export class MultiPriceComponent implements OnInit {
  @Input() modalTitle: string;
  @Input() multiPrice: MultiPrices;
  @Input() itemId?: number;
  form: FormGroup;

  constructor(
    private modalController: ModalController,
    private fb: FormBuilder,
    private databaseService: DatabaseService
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      description: [this.multiPrice?.description, [Validators.maxLength(255)]],
      price: [
        this.multiPrice?.price,
        [Validators.required, Validators.min(0), priceValidator()],
      ],
    });
  }

  async makeMultiPrice() {
    let multiPrice: MultiPrices = this.form.value;
    multiPrice = {
      ...multiPrice,
      itemId: this.itemId,
    };
    if (!this.multiPrice) {
      await this.databaseService.addMultPrice(multiPrice);
      this.modalController.dismiss('Added Succesfully');
    } else {
      multiPrice = {
        ...multiPrice,
        multiPriceId: this.multiPrice.multiPriceId,
      };
      await this.databaseService.editMultiPrice(multiPrice);
      this.modalController.dismiss('Edited Succesfully');
    }
  }

  cancel() {
    this.modalController.dismiss();
  }
}
