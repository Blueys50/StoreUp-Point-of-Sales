import { Component, Inject, OnInit } from '@angular/core';
import { Form, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { settings } from 'cluster';
import { error } from 'console';
import { Company } from 'src/models/company';
import { googleAccount } from 'src/models/googleAccount';
import { Setting } from 'src/models/settings';
import { BluetoothPrinterService } from 'src/services/bluetoothPrinter.service';
import { GoogleService } from 'src/services/google.service';
import { StorageService } from 'src/services/storage.service';
import { Plugins } from '@capacitor/core';

const { Permissions } = Plugins;
import ZbtPrinter from '@sbenitez73/cordova-ble-zbtprinter';
import { ModalController, ToastController } from '@ionic/angular';
import { ChoosePrinterComponent } from './choose-printer/choose-printer.component';

const { PermissionsPlugin } = Plugins;

@Component({
  selector: 'setting-view',
  templateUrl: './setting-view.component.html',
  styleUrls: ['./setting-view.component.scss'],
})
export class SettingViewComponent implements OnInit {
  form: FormGroup;
  companySetting: any;
  bluetoothList: any = [];
  currentPrinter: any;
  constructor(
    public googleService: GoogleService,
    private storageService: StorageService,
    private fb: FormBuilder,
    private modalController: ModalController,
    private toastController: ToastController
  ) {}

  async ngOnInit() {
    this.companySetting = await this.storageService.get(Company.storageKey);
    this.form = this.fb.group({
      companyName: [
        this.companySetting?.companyName,
        [Validators.required, Validators.maxLength(255)],
      ],
      companyAddress: [
        this.companySetting?.companyAddress,
        [Validators.maxLength(255)],
      ],
      currency: [this.companySetting?.currency, Validators.maxLength(3)],
      footerText: [
        this.companySetting?.footerText,
        [Validators.maxLength(255)],
      ],
      maxCharLine: [
        this.companySetting?.maxCharLine
          ? this.companySetting?.maxCharLine
          : 32,
        [Validators.min(32)],
      ],
      allowPrint: [this.companySetting?.allowPrint],
    });
    this.currentPrinter = this.companySetting?.printer;
  }

  async loginGoogle() {
    await this.googleService.signIn();
  }

  async logOut() {
    await this.googleService.signOut();
  }

  async cancel() {
    let res = await this.storageService.get(Company.storageKey);
    this.companySetting = res;
    this.form = this.fb.group({
      companyName: [
        this.companySetting?.companyName,
        [Validators.required, Validators.maxLength(255)],
      ],
      companyAddress: [
        this.companySetting?.companyAddress,
        [Validators.maxLength(255)],
      ],
      currency: [this.companySetting?.currency, Validators.maxLength(3)],
      footerText: [
        this.companySetting?.footerText,
        [Validators.maxLength(255)],
      ],
      maxCharLine: [
        this.companySetting?.maxCharLine
          ? this.companySetting?.maxCharLine
          : 32,
        [Validators.max(255)],
      ],
      allowPrint: [this.companySetting?.allowPrint],
    });
    this.currentPrinter = this.companySetting?.printer;
  }

  async saveSetting() {
    let company: Company = this.form.value;
    company = {
      ...company,
      printer: this.currentPrinter,
    };
    this.storageService.set(Company.storageKey, company);
    let a = await this.storageService.get(Company.storageKey);
    this.form.markAsPristine();
    this.makeToast('Success');
  }

  async choosePrinter() {
    let modal = await this.modalController.create({
      component: ChoosePrinterComponent,
      componentProps: {
        modalTitle: 'Choose active printer',
        printer: this.currentPrinter,
      },
      cssClass: 'auto-height',
    });
    await modal.present();
    let data = await modal.onDidDismiss();
    if (data?.data) {
      this.currentPrinter = data.data;
      this.form.markAsDirty();
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
}
