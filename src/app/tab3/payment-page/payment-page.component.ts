import { Component, Input, OnInit } from '@angular/core';
import {
  FormGroup,
  FormControl,
  FormBuilder,
  Validators,
} from '@angular/forms';
import {
  ModalController,
  ToastController,
  LoadingController,
} from '@ionic/angular';
import { Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { Cashier } from 'src/models/cashier';
import { Customer } from 'src/models/customer';
import { Item } from 'src/models/item';
import { PaymentMethod } from 'src/models/paymentMethod';
import { Setting } from 'src/models/settings';
import { priceValidator } from 'src/services/common.service';
import { DatabaseService } from 'src/services/database.service';
import { ScanService } from 'src/services/scan.service';
import { StorageService } from 'src/services/storage.service';
import { PaymentItemDetailComponent } from './payment-item-detail/payment-item-detail.component';
import { salesDetail } from 'src/models/salesDetail';
import { salesHeader } from 'src/models/salesHeader';
import { purchaseDetail } from 'src/models/purchaseDetail';
import { purchaseHeader } from 'src/models/purchaseHeader';
import { ChangingChangeableFieldComponent } from './changing-changeable-field/changing-changeable-field.component';
import { add, format } from 'date-fns';
import { Company } from 'src/models/company';
import { BluetoothPrinterService } from 'src/services/bluetoothPrinter.service';

@Component({
  selector: 'payment-page',
  templateUrl: './payment-page.component.html',
  styleUrls: ['./payment-page.component.scss'],
})
export class PaymentPageComponent implements OnInit {
  @Input() modalTitle: string;
  @Input() salesHeader: any;
  @Input() purchaseHeader: any;
  selectedOption: any;
  isSales: boolean = true;
  private _subscription: Subscription;
  filterForm = new FormGroup({
    search: new FormControl(''),
  });
  showIsEmpty: boolean = true;
  showDropdown: boolean = false;
  subscriptionRefresh: Subscription;
  salesList: salesDetail[] = [];
  purchaseList: purchaseDetail[] = [];
  cashier: Cashier | any;
  customer: Customer | any;
  paymentMethod: PaymentMethod | any;
  sumPriceSales: number | any = undefined;
  moneyLeftSales: number | any = undefined;
  sumPricePurchase: number | any = undefined;
  moneyLeftPurchase: number | any = undefined;
  payForm: FormGroup;
  purchaseForm: FormGroup;
  isPrint: boolean = true;
  showPrintCheck: boolean;
  currency: any;

  constructor(
    public databaservice: DatabaseService,
    private modalController: ModalController,
    private toastController: ToastController,
    private loadingCtrl: LoadingController,
    public scanService: ScanService,
    private storageService: StorageService,
    private fb: FormBuilder,
    private loadingController: LoadingController,
    private print: BluetoothPrinterService
  ) {}
  itemList: Item[] | any;

  async ngOnInit() {
    let company = await this.storageService.get(Company.storageKey);
    if (company?.allowPrint) {
      this.showPrintCheck = true;
    }
    this.currency = company?.currency;
    await this.databaservice.createDatabase();
    this._subscription = this.filterForm.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((params) => this.searchDropdown(params));
    let setting: Setting = await this.storageService.get(Setting.storageKey);
    if (!this.modalTitle) {
      this.cashier = setting.activeCashier;
      this.customer = setting.defaultCustomer;
      this.paymentMethod = setting.defaultPaymentMethod;
    } else {
      if (this.salesHeader) {
        this.cashier = this.salesHeader.createdByCashier;
        this.customer = this.salesHeader.customerName;
        this.paymentMethod = this.salesHeader.paymentMethodName;
        this.moneyLeftSales = this.salesHeader.change
          ? this.salesHeader.change
          : 0;
        this.sumPriceSales = this.salesHeader.totalPrice;
        let items = await this.databaservice.getSalesDetail(
          this.salesHeader.salesHeaderId
        );
        this.isSales = true;
        (items as any[]).forEach(async (i) => {
          let res = await this.databaservice.getItems(i.itemId);
          this.selectItem(res[0] as any, i);
        });
      } else {
        this.cashier = this.purchaseHeader.createdByCashier;
        this.customer = this.purchaseHeader.customerName;
        this.paymentMethod = this.purchaseHeader.paymentMethodName;
        this.moneyLeftPurchase = this.purchaseHeader.change
          ? this.purchaseHeader.change
          : 0;
        this.sumPriceSales = this.purchaseHeader.totalPrice;
        let items = await this.databaservice.getPurchaseDetail(
          this.purchaseHeader.purchaseHeaderId
        );
        this.isSales = false;
        (items as any[]).forEach(async (i) => {
          let res = await this.databaservice.getItems(i.itemId);
          this.selectItem(res[0] as any, i);
        });
      }
    }
    this.payForm = this.fb.group({
      paySales: [
        this.salesHeader?.payment,
        [Validators.min(0), Validators.required, priceValidator()],
      ],
    });
    this.purchaseForm = this.fb.group({
      payPurchase: [
        this.purchaseHeader?.payment,
        [Validators.min(0), Validators.required, priceValidator()],
      ],
    });
    this.payForm.controls['paySales'].valueChanges.subscribe((value) => {
      if (this.isSales && this.sumPriceSales) {
        this.moneyLeftSales = value - this.sumPriceSales;
      }
    });
    this.purchaseForm.controls['payPurchase'].valueChanges.subscribe(
      (value) => {
        if (!this.isSales && this.sumPricePurchase) {
          this.moneyLeftPurchase = value - this.sumPricePurchase;
        }
      }
    );
  }

  async searchDropdown(params): Promise<void> {
    if (params.search) {
      this.itemList = [];
      this.itemList = await this.databaservice.getItems(undefined, {
        isArchived: false,
        search: params?.search,
      });
      this.showDropdown = true;
    } else {
      this.showDropdown = false;
    }
  }

  ngOnDestroy(): void {}

  async filterChanged(params?: any): Promise<void> {
    this.showDropdown = true;
    this.itemList = [];
    this.itemList = await this.databaservice.getItems(undefined, {
      isArchived: false,
      search: params?.search,
    });
  }

  async edit(item: salesDetail) {
    let modal = await this.modalController.create({
      component: PaymentItemDetailComponent,
      componentProps: {
        modalTitle: this.isSales ? 'Edit Sales Item' : 'Edit Purchase Item',
        paymentItem: item,
        isSales: this.isSales,
      },
      cssClass: this.isSales ? 'auto-height no-padding-top' : 'auto-height',
    });
    await modal.present();
    let data = await modal.onDidDismiss();
    if (data?.data) {
      if (data.data == 'remove') {
        this.removeItem(item);
      } else {
        if (this.isSales) {
          let idx = this.salesList.findIndex((i) => i.itemId == item.itemId);
          this.salesList[idx] = data.data;
        } else {
          let idx = this.purchaseList.findIndex((i) => i.itemId == item.itemId);
          this.purchaseList[idx] = data.data;
        }
      }
      if (this.isSales) {
        this.sumPriceSales = 0;
        this.salesList.forEach((i) => {
          if (i.totalPrice) this.sumPriceSales += i.totalPrice;
        });
      } else {
        this.sumPricePurchase = 0;
        this.purchaseList.forEach((i) => {
          if (i.totalPrice) this.sumPricePurchase += i.totalPrice;
        });
      }
      this.setChange();
    }
  }

  removeItem(item) {
    if (this.isSales) {
      this.salesList = this.salesList.filter((i) => i.itemId != item.itemId);
    } else {
      this.purchaseList = this.purchaseList.filter(
        (i) => i.itemId != item.itemId
      );
    }
  }

  async changeType() {
    this.isSales = !this.isSales;
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

  selectItem(item: Item, itemRecord?) {
    if (this.isSales) {
      let idx = this.salesList.findIndex((s) => s.itemId == item.itemId);
      if (idx != -1) {
        let qty = this.salesList[idx].qty;
        let stock = this.salesList[idx].stockAfter;
        let sp = this.salesList[idx].sellingPrice;
        if (qty && sp) {
          this.salesList[idx].qty = qty + 1;
          this.salesList[idx].totalPrice = (qty + 1) * sp;
        }
        if (this.salesList[idx].isCountStock && stock) {
          this.salesList[idx].stockAfter = stock - 1;
        }
      } else {
        let salesDetail: salesDetail = {
          itemId: item.itemId,
          sellingPrice: item.sellingPrice,
          unit: !itemRecord ? item.unitName : itemRecord.unit,
          qty: !itemRecord ? 1 : itemRecord.qty,
          itemName: item.itemName,
          itemCode: item.itemCode,
          isCountStock: item.isCountStock,
        };
        if (item.sellingPrice) {
          salesDetail.totalPrice =
            (!itemRecord ? 1 : itemRecord.qty) * item.sellingPrice;
        }
        if (item.isCountStock && item.stock) {
          salesDetail.stockAfter = item.stock - 1;
        }
        this.salesList.push(salesDetail);
        this.showDropdown = false;
        this.filterForm.controls['search'].setValue('');
        this.sumPriceSales = 0;
        this.salesList.forEach((i) => {
          if (i.totalPrice) this.sumPriceSales += i.totalPrice;
        });
      }
    } else {
      let idx = this.purchaseList.findIndex((s) => s.itemId == item.itemId);
      if (idx != -1) {
        let qty = this.purchaseList[idx].qty;
        let sp = this.purchaseList[idx].sellingPrice;
        if (qty) {
          this.purchaseList[idx].qty = qty + 1;
          this.purchaseList[idx].totalPrice = (qty + 1) * (sp ? sp : 0);
        }
      } else {
        let purchaseDetail: purchaseDetail = {
          itemId: item.itemId,
          sellingPrice: item.buyingPrice ? item.buyingPrice : 0,
          unit: !itemRecord ? item.unitName : itemRecord.unit,
          qty: !itemRecord ? 1 : itemRecord.qty,
          itemName: item.itemName,
          itemCode: item.itemCode,
          isCountStock: item.isCountStock,
          stock: item.stock,
        };
        if (item.sellingPrice) {
          purchaseDetail.totalPrice =
            (!itemRecord ? 1 : itemRecord.qty) *
            (item.buyingPrice ? item.buyingPrice : 0);
        }
        this.purchaseList.push(purchaseDetail);
        this.showDropdown = false;
        this.filterForm.controls['search'].setValue('');
        this.sumPricePurchase = 0;
        this.purchaseList.forEach((i) => {
          if (i.totalPrice) this.sumPricePurchase += i.totalPrice;
        });
      }
    }
    this.showDropdown = false;
    this.setChange();
  }

  setChange(e?) {
    if (this.isSales) {
      let pay: number = this.payForm.value.paySales;
      if (this.sumPriceSales && pay) {
        this.moneyLeftSales = pay - this.sumPriceSales;
      }
    } else {
      let pay: number = this.purchaseForm.value.payPurchase;
      if (this.sumPricePurchase && pay) {
        this.moneyLeftPurchase = pay - this.sumPricePurchase;
      }
    }
  }

  async abortPayment() {
    if (this.isSales) {
      this.salesList = [];
      this.sumPriceSales = undefined;
      this.payForm.reset();
      this.moneyLeftSales = undefined;
    } else {
      this.purchaseList = [];
      this.sumPricePurchase = undefined;
      this.purchaseForm.reset();
      this.moneyLeftPurchase = undefined;
    }
    let setting: Setting = await this.storageService.get(Setting.storageKey);
    this.cashier = setting.activeCashier;
    this.customer = setting.defaultCustomer;
    this.paymentMethod = setting.defaultPaymentMethod;
    let company = await this.storageService.get(Company.storageKey);
    if (company?.allowPrint) {
      this.showPrintCheck = true;
    }
  }

  cancel() {
    this.modalController.dismiss();
  }

  async makePayment() {
    let loading = await this.loadingController.create();
    await loading.present();
    await this.printInvoice();
    if (this.isSales) {
      let paySales: number = this.payForm.value.paySales;
      let salesHeader: salesHeader | any = {
        customerId: this.customer.customerId,
        cashierId: this.cashier.cashierId,
        paymentMethodName: this.paymentMethod.paymentMethodName,
        totalItem: this.salesList.length,
        totalPrice: this.sumPriceSales,
        payment: paySales,
        change: this.moneyLeftSales,
        isCredit: this.moneyLeftSales < 0 ? 1 : 0,
      };

      let salesHeaderId = await this.databaservice.addSalesHeader(salesHeader);

      if (salesHeaderId) {
        this.salesList.forEach(async (s: salesDetail) => {
          s = {
            ...s,
            salesDetailHeaderId: salesHeaderId,
          };
          let stock = s.stockAfter;
          let bol = s.isCountStock;

          //Removing view only fields
          delete s.itemName;
          delete s.itemCode;
          delete s.isCountStock;
          delete s.totalPrice;
          delete s.stockAfter;
          let b = await this.databaservice.addSalesDetail(s);
          if ((bol as any) == 1) {
            await this.databaservice.editItem({
              itemId: s.itemId,
              stock: stock,
            });
          }
        });
        let a = await this.databaservice.getSalesDetail(salesHeaderId);
      }
    } else {
      let payPurchase: number = this.purchaseForm.value.payPurchase;
      let purchaseHeader: purchaseHeader | any = {
        cashierId: this.cashier.cashierId,
        paymentMethodName: this.paymentMethod.paymentMethodName,
        totalItem: this.purchaseList.length,
        totalPrice: this.sumPricePurchase,
        payment: payPurchase,
        change: this.moneyLeftPurchase,
        isCredit: this.moneyLeftPurchase < 0 ? 1 : 0,
      };
      let purchaseHeaderId = await this.databaservice.addPurchaseHeader(
        purchaseHeader
      );
      if (purchaseHeaderId) {
        this.purchaseList.forEach(async (s: purchaseDetail) => {
          s = {
            ...s,
            purchaseDetailHeaderId: purchaseHeaderId,
          };
          let bol = s.isCountStock;
          let stock = s.stock;
          let qty = s.qty;
          //Removing view only fields
          delete s.itemName;
          delete s.itemCode;
          delete s.isCountStock;
          delete s.totalPrice;
          delete s.stock;
          await this.databaservice.addPurchaseDetail(s);
          if ((bol as any) == 1 && stock && qty) {
            await this.databaservice.editItem({
              itemId: s.itemId,
              stock: parseInt(stock.toString()) + parseInt(qty.toString()),
            });
          }
        });
      }
    }
    await loading.dismiss();
    await this.makeToast('Success');
    this.abortPayment();
  }

  formatItemLine(
    idx: number,
    itemName: string,
    qty: number,
    price: number,
    maxLength: number,
    currency
  ): string {
    const itemLine = `${idx}. ${itemName}`;
    const qtyLine = `${qty} x ${price}`;
    const totalLine = `   ${currency}${qty * price}`;

    let formattedItemLine = '';
    const qtyTotalSpacing = ' '.repeat(
      maxLength - (itemLine.length + qtyLine.length + totalLine.length) - 1
    );

    if (itemLine.length + qtyLine.length + totalLine.length <= maxLength) {
      // If the entire item information fits on one line, use the original formatting
      formattedItemLine = `${itemLine} ${qtyLine}${qtyTotalSpacing}${totalLine}`;
    } else {
      // Split the item information into multiple lines
      formattedItemLine = `${itemLine}\n${' '.repeat(
        idx.toString().length + 2
      )}${qtyLine}${qtyTotalSpacing}${totalLine}`;
    }

    return formattedItemLine;
  }

  async printInvoice(isDup?: boolean) {
    if (this.showPrintCheck && this.isPrint) {
      let company: Company | any = await this.storageService.get(
        Company.storageKey
      );
      let currency = company.currency ? company.currency : '';
      let header = `\n${company.companyName} \n`;
      let address = company.companyAddress ? company.companyAddress + `\n` : '';
      let footer = company.footerText ? company.footerText + `\n` : '';
      let activeCashier = `Cashier: ${
        this.cashier.cashierName ? this.cashier.cashierName : this.cashier
      } \n`;
      let customer = `Customer: ${
        this.customer.customerName ? this.customer.customerName : this.customer
      } \n`;
      let currentDate = new Date();
      let formattedDate = format(currentDate, 'dd/MMM/yyyy HH:mm');
      let summaryInvoice = ``;

      if (this.isSales) {
        summaryInvoice = `Total Price : ${currency}${this.sumPriceSales} \n${
          this.paymentMethod?.paymentMethodName
            ? this.paymentMethod?.paymentMethodName
            : this.paymentMethod
        }:  ${currency}${this.payForm.value.paySales} \nChange :  ${currency}${
          this.moneyLeftSales
        } \n`;
      } else {
        summaryInvoice = `Total Price :  ${currency}${
          this.sumPricePurchase
        } \n${
          this.paymentMethod?.paymentMethodName
            ? this.paymentMethod?.paymentMethodName
            : this.paymentMethod
        }:  ${currency}${this.payForm.value.paySales} \nChange :  ${currency}${
          this.moneyLeftPurchase
        } \n`;
      }
      let breaker = '';
      for (let i = 0; i < company?.maxCharLine; i++) {
        breaker += '-';
      }
      breaker += `\n`;

      let content = '';
      if (this.isSales) {
        this.salesList.forEach((e: any, index) => {
          content += this.formatItemLine(
            index + 1,
            e.itemName,
            e.qty,
            e.sellingPrice,
            company.maxCharLine,
            currency
          );
          content += `\n`;
        });
      } else {
        this.purchaseList.forEach((e: any, idx) => {
          content += this.formatItemLine(
            idx + 1,
            e.itemName,
            e.qty,
            e.sellingPrice,
            company.maxCharLine,
            currency
          );
          content += `\n`;
        });
      }

      let myText =
        header +
        address +
        breaker +
        (isDup ? 'Reprint in ' + formattedDate : formattedDate) +
        `\n` +
        activeCashier +
        (this.isSales ? customer : '') +
        `\n` +
        content +
        `\n` +
        summaryInvoice +
        breaker +
        footer +
        `Print With StoreUp \n\n\n`;
      await this.print.sendToBluetoothPrinter(
        company?.printer?.address,
        myText
      );
    }
  }

  async updatePayment() {
    let loading = await this.loadingController.create();
    await loading.present();
    let ogItem: any;
    let newItemList: any;
    if (this.isSales) {
      newItemList = this.salesList;
      ogItem = await this.databaservice.getSalesDetail(
        this.salesHeader.salesHeaderId
      );
    } else {
      newItemList = this.purchaseList;
      ogItem = await this.databaservice.getPurchaseDetail(
        this.purchaseHeader.purchaseHeaderId
      );
    }
    await this.printInvoice();
    // 3=add
    // 4=up
    let result: any[] = [];
    for (const itemA of ogItem) {
      const matchingItemIndex = newItemList.findIndex(
        (itemB) => itemB.itemId === (itemA.itemId as any)
      );
      if (matchingItemIndex !== -1) {
        const itemB = newItemList[matchingItemIndex];
        if (
          itemA.itemId === itemB.itemId &&
          itemA.qty === itemB.qty &&
          itemA.sellingPrice === itemB.sellingPrice &&
          itemA.unit == itemB.unit
        ) {
        } else {
          let res = { ...itemB, value: 4 };
          result.push(res);
        }
        newItemList.splice(matchingItemIndex, 1);
      } else {
        let res = { ...itemA, value: 1 };
        result.push(res);
      }
    }
    for (const itemB of newItemList) {
      let res = { ...itemB, value: 3 };
      result.push(res);
    }
    result.forEach(async (r) => {
      if (r.value == 1) {
        if (this.salesHeader) await this.databaservice.deleteSalesDetail(r);
        else await this.databaservice.deletePurchaseDetail(r);
        let res: any = await this.databaservice.getItems(r.itemId);
        let item = res[0];
        if (item.isCountStock) {
          item = {
            ...item,
            stock:
              parseInt(item.stock.toString()) +
              (this.isSales
                ? parseInt(r.qty.toString())
                : parseInt(r.qty.toString()) * -1),
          };
          await this.databaservice.editItem(item);
        }
      } else if (r.value == 3) {
        let res: any = await this.databaservice.getItems(r.itemId);
        let item = res[0];
        if (item.isCountStock) {
          item = {
            ...item,
            stock:
              parseInt(item.stock.toString()) -
              (this.isSales
                ? parseInt(r.qty.toString())
                : parseInt(r.qty.toString()) * -1),
          };
          await this.databaservice.editItem(item);
        }
        delete r.itemName;
        delete r.itemCode;
        delete r.isCountStock;
        delete r.totalPrice;
        delete r.value;
        delete r.stockAfter;
        r.salesDetailHeaderId = this.salesHeader.salesHeaderId;
        if (this.salesHeader) {
          await this.databaservice.addSalesDetail(r);
        } else await this.databaservice.addPurchaseDetail(r);
      } else if (r.value == 4) {
        let idx = ogItem.findIndex((i) => i.itemId == r.itemId);
        let finItem = {
          ...ogItem[idx],
          itemId: r.itemId,
          qty: r.qty,
          sellingPrice: r.sellingPrice,
          unit: r.unit,
        };
        if (this.salesHeader) {
          await this.databaservice.editSalesDetail(finItem);
        } else {
          await this.databaservice.editPurchaseDetail(finItem);
        }
        let a = await this.databaservice.getSalesDetail();
        let res: any = await this.databaservice.getItems(r.itemId);
        let item = res[0];
        if (item.isCountStock) {
          item = {
            ...item,
            stock:
              parseInt(item.stock.toString()) +
              (this.isSales
                ? parseInt(ogItem[idx].qty.toString()) -
                  parseInt(r.qty.toString())
                : (parseInt(ogItem[idx].qty.toString()) -
                    parseInt(r.qty.toString())) *
                  -1),
          };
          await this.databaservice.editItem(item);
        }
      }
    });
    if (this.salesHeader) {
      let paySales: number = this.payForm.value.paySales;
      let salesHeader: salesHeader | any = {
        customerId: this.customer.customerId,
        cashierId: this.cashier.cashierId,
        paymentMethodName: this.paymentMethod.paymentMethodName,
        totalItem: this.salesList.length,
        totalPrice: this.sumPriceSales,
        payment: paySales,
        change: this.moneyLeftSales,
        isCredit: this.moneyLeftSales < 0 ? 1 : 0,
        salesHeaderId: this.salesHeader.salesHeaderId,
      };
      await this.databaservice.editSalesHeader(salesHeader);
    } else {
      let payPurchase: number = this.purchaseForm.value.payPurchase;
      let purchaseHeader: purchaseHeader | any = {
        cashierId: this.cashier.cashierId,
        paymentMethodName: this.paymentMethod.paymentMethodName,
        totalItem: this.salesList.length,
        totalPrice: this.sumPricePurchase,
        payment: payPurchase,
        change: this.moneyLeftPurchase,
        isCredit: this.moneyLeftPurchase < 0 ? 1 : 0,
        purchaseHeaderId: this.purchaseHeader.purchaseHeaderId,
      };
      await this.databaservice.editPurchaseHeader(purchaseHeader);
    }

    await loading.dismiss();
    await this.makeToast('Update Succesfully');
    await this.modalController.dismiss();
  }

  async changeField(type) {
    let title = `Change ${type}`;
    let modal = await this.modalController.create({
      component: ChangingChangeableFieldComponent,
      componentProps: {
        modalTitle: title,
        cashier: type == 'Cashier' ? this.cashier : '',
        paymentMethod: type == 'PaymentMethod' ? this.paymentMethod : '',
        customer: type == 'Customer' ? this.customer : '',
      },
      cssClass: 'auto-height',
    });
    await modal.present();
    let data = await modal.onDidDismiss();
    if (data?.data) {
      if (type == 'Cashier') {
        this.cashier = data.data;
      } else if (type == 'PaymentMethod') {
        this.paymentMethod = data.data;
      } else {
        this.customer = data.data;
      }
    }
  }

  async deleteInvoice() {
    let loading = await this.loadingController.create();
    await loading.present();
    let ogItem;
    if (this.isSales) {
      ogItem = await this.databaservice.getSalesDetail(
        this.salesHeader.salesDetailHeaderId
      );
    } else {
      ogItem = await this.databaservice.getPurchaseDetail(
        this.purchaseHeader.purchaseDetailHeaderId
      );
    }
    ogItem.forEach(async (r) => {
      if (this.salesHeader) await this.databaservice.deleteSalesDetail(r);
      else await this.databaservice.deletePurchaseDetail(r);
      let res: any = await this.databaservice.getItems(r.itemId);
      let item = res[0];
      if (item.isCountStock) {
        item = {
          ...item,
          stock: parseInt(item.stock.toString()) + parseInt(r.qty.toString()),
        };
        await this.databaservice.editItem(item);
      }
    });

    if (this.isSales) {
      let a = await this.databaservice.deleteSalesHeader(this.salesHeader);
    } else {
      await this.databaservice.deletePurchaseHeader(this.purchaseHeader);
    }
    await loading.dismiss();
    await this.makeToast('Update Succesfully');
    await this.modalController.dismiss();
  }
}
