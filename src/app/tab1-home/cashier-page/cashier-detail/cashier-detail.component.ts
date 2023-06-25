import { Component, Input, OnInit } from '@angular/core';
import { Form, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { Cashier } from 'src/models/cashier';
import { Setting } from 'src/models/settings';
import { DatabaseService } from 'src/services/database.service';
import { StorageService } from 'src/services/storage.service';

@Component({
  selector: 'cashier-detail',
  templateUrl: './cashier-detail.component.html',
  styleUrls: ['./cashier-detail.component.scss'],
})
export class CashierDetailComponent implements OnInit {
  @Input() modalTitle: string;
  @Input() cashier: Cashier;
  @Input() isActive?: boolean;
  form: FormGroup;

  constructor(
    private modalController: ModalController,
    private fb: FormBuilder,
    private databaseService: DatabaseService,
    private storageService: StorageService
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      cashierName: [
        this.cashier?.cashierName,
        [Validators.required, Validators.maxLength(255)],
      ],
      pin: ['', [Validators.minLength(6), Validators.maxLength(6)]],
    });
  }

  async makeCashier() {
    let cashier: Cashier = this.form.value;
    if (!this.cashier) {
      await this.databaseService.addCashier(cashier);
      this.modalController.dismiss('Added Succesfully');
    } else {
      cashier = {
        ...cashier,
        cashierId: this.cashier.cashierId,
      };
      await this.databaseService.editCashier(
        cashier,
        this.isActive ? cashier.cashierName : ''
      );
      if (this.isActive) {
        let actCashier = await this.databaseService.getCashiers(
          cashier.cashierId
        );
        let setting: Setting = await this.storageService.get(
          Setting.storageKey
        );
        setting = {
          ...setting,
          activeCashier: actCashier[0] as any,
        };
        this.storageService.set(Setting.storageKey, setting);
      }
      this.modalController.dismiss('Edited Succesfully');
    }
  }

  cancel() {
    this.modalController.dismiss();
  }
}
