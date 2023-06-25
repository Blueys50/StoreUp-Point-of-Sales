import { Component, Input, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { MultiPrices } from 'src/models/multiPrice';
import { Package } from 'src/models/package';
import { priceValidator } from 'src/services/common.service';
import { DatabaseService } from 'src/services/database.service';

@Component({
  selector: 'package',
  templateUrl: './package.component.html',
  styleUrls: ['./package.component.scss'],
})
export class PackageComponent implements OnInit {
  @Input() modalTitle: string;
  @Input() package: Package;
  @Input() itemId?: number;
  form: FormGroup;

  constructor(
    private modalController: ModalController,
    private fb: FormBuilder,
    private databaseService: DatabaseService
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      packageName: [
        this.package?.packageName,
        [Validators.required, Validators.maxLength(255)],
      ],
      packagePrice: [
        this.package?.packagePrice,
        [Validators.required, Validators.min(0), priceValidator()],
      ],
      packageQty: [
        this.package?.packageQty,
        [Validators.required, Validators.min(0)],
      ],
    });
  }

  async makeMultiPrice() {
    let pack: Package = this.form.value;
    pack = {
      ...pack,
      itemId: this.itemId,
    };
    if (!this.package) {
      await this.databaseService.addPackage(pack);
      this.modalController.dismiss('Added Succesfully');
    } else {
      pack = {
        ...pack,
        packageId: this.package.packageId,
      };
      await this.databaseService.editPackage(pack);
      this.modalController.dismiss('Edited Succesfully');
    }
  }

  cancel() {
    this.modalController.dismiss();
  }
}
