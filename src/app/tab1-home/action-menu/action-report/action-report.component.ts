import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalController, ToastController } from '@ionic/angular';
import { startOfDay, endOfDay, isAfter } from 'date-fns';
import { Settings } from 'ngpq-table';
import { ItemDetailComponent } from 'src/app/tab2/item-page/item-detail/item-detail.component';
import { PaymentPageComponent } from 'src/app/tab3/payment-page/payment-page.component';
import { Company } from 'src/models/company';
import { salesHeader } from 'src/models/salesHeader';
import { Setting } from 'src/models/settings';
import { CommonService } from 'src/services/common.service';
import { DatabaseService } from 'src/services/database.service';
import { StorageService } from 'src/services/storage.service';

@Component({
  selector: 'action-report',
  templateUrl: './action-report.component.html',
  styleUrls: ['./action-report.component.scss'],
})
export class ActionReportComponent implements OnInit {
  dataSource: string | salesHeader[];
  sortBy: string = 'createdDate';
  columnConfig;
  settings: { [key: string]: Settings };
  data: any[];
  showTable: boolean;
  isItem: boolean;
  startDate: string;
  endDate: string;
  constructor(
    private databaseService: DatabaseService,
    private toastController: ToastController,
    private router: Router,
    private route: ActivatedRoute,
    private storageService: StorageService,
    private commonService: CommonService
  ) {}

  async ngOnInit() {}

  async ionViewWillEnter() {
    let queryParams = this.route.snapshot.queryParams;
    if (queryParams['isItem'] != null) {
      this.isItem = queryParams['isItem'];
    }
    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().slice(0, 10);
    this.startDate = formattedDate;
    this.endDate = formattedDate;
    this.data = await this.getRes();
    this.settings = this.getTable();
    this.showTable = true;
  }
  getTable(): { [key: string]: Settings } {
    if (this.isItem) {
      return {
        itemId: {
          title: 'id',
          width: '50px',
          disableSort: true,
        },
        itemName: {
          title: 'Name',
          width: '100px',
          disableSort: true,
        },
        totalSalesPrice: {
          title: 'Total Sales',
          width: '180px',
          disableSort: true,
        },
        salesQty: {
          title: 'Qty',
          width: '80px',
          disableSort: true,
        },
        totalPurchasePrice: {
          title: 'Total Purchase',
          width: '180px',
          disableSort: true,
        },
        purchaseQty: {
          title: 'Qty',
          width: '80px',
          disableSort: true,
        },
      };
    }
    return {
      customerId: {
        title: 'id',
        width: '50px',
        disableSort: true,
      },
      customerName: {
        title: 'Name',
        width: '180px',
        disableSort: true,
      },
      payment: {
        title: 'Total Payment',
        width: '200px',
        disableSort: true,
      },
      credit: {
        title: 'Total Credit',
        width: '200px',
        disableSort: true,
      },
    };
  }

  async generateReport() {
    let valid = this.checkDateValidation();
    if (valid) {
      this.showTable = false;
      this.data = [];
      this.data = await this.getRes();
      this.showTable = true;
    } else {
      const toast = await this.toastController.create({
        message: 'StartDate is later than EndDate, please check it',
        duration: 2000,
        buttons: [{ text: 'DONE', role: 'cancel' }],
      });
      toast.present();
    }
  }

  checkDateValidation() {
    let startDate = startOfDay(new Date(this.startDate));
    let endDate = endOfDay(new Date(this.endDate));
    if (isAfter(startDate, endDate)) {
      return false;
    }
    return true;
  }

  async changeType() {
    this.showTable = false;
    this.isItem = !this.isItem;
    this.data = await this.getRes();
    this.settings = this.getTable();
    this.showTable = true;
  }

  async cellClick(e: any) {
    if (!this.isItem) {
      this.commonService.showInvoiceReport = true;
      this.commonService.customer = {
        customerName: e.row.customerName,
        customerId: e.row.customerId,
      };
      await this.router.navigate(['../tabs/tab4']);
    }
  }

  async getRes() {
    let res;
    if (this.isItem) {
      let sales = await this.databaseService.getSalesDetail(
        undefined,
        undefined,
        {
          startDate: startOfDay(new Date(this.startDate)),
          endDate: endOfDay(new Date(this.endDate)),
        }
      );
      let purchase = await this.databaseService.getPurchaseDetail(
        undefined,
        undefined,
        {
          startDate: startOfDay(new Date(this.startDate)),
          endDate: endOfDay(new Date(this.endDate)),
        }
      );
      res = sales.concat(purchase as any);
    } else {
      let sales = await this.databaseService.getSalesHeader({
        startDate: startOfDay(new Date(this.startDate)),
        endDate: endOfDay(new Date(this.endDate)),
      });
      res = sales;
    }
    let a = this.isItem
      ? await this.getItemReport(res)
      : await this.getCustomerReport(res);
    res = a;
    res = res.sort((a, b) => {
      if (this.sortBy == 'date') {
        return this.getCompareResult(a.createdDate, b.createdDate);
      } else if (this.sortBy == 'totalSales') {
        return this.getCompareResult(a.totalSales, b.totalSales);
      } else if (this.sortBy == 'salesQty') {
        return this.getCompareResult(a.salesQty, b.salesQty);
      } else if (this.sortBy == 'totalPayment') {
        return this.getCompareResult(a.payment, b.payment);
      }
      return this.getCompareResult(a.credit, b.credit);
    });
    if (this.sortBy == 'salesQty') {
      return res.reverse();
    }
    return res;
  }

  getCompareResult(a, b): number {
    if (a < b) {
      return -1;
    }

    if (a > b) {
      return 1;
    }

    return 0;
  }

  async getItemReport(res: any): Promise<any> {
    let itemList: any[] = [];
    res.forEach(async (r) => {
      let idx = itemList.findIndex((i) => i.itemId == r.itemId);
      if (idx == -1) {
        let price = r.sellingPrice * r.qty;
        let salesId = r.salesDetailHeaderId;
        let item = {
          itemId: r.itemId,
          totalSalesPrice: salesId ? price : undefined,
          totalPurchasePrice: !salesId ? price : undefined,
          salesQty: salesId ? r.qty : undefined,
          purchaseQty: !salesId ? r.qty : undefined,
        };
        itemList.push(item);
      } else {
        let price = r.sellingPrice * r.qty;
        let salesId = r.salesDetailHeaderId;
        if (salesId) {
          itemList[idx].totalSalesPrice = itemList[idx].totalSalesPrice
            ? parseFloat(itemList[idx].totalSalesPrice?.toString()) +
              parseFloat(price.toString())
            : parseFloat(price.toString());
          itemList[idx].salesQty = itemList[idx].salesQty
            ? parseInt(itemList[idx].salesQty?.toString()) +
              parseInt(r.qty.toString())
            : parseInt(r.qty.toString());
        } else {
          itemList[idx].totalPurchasePrice = itemList[idx].totalPurchasePrice
            ? parseFloat(itemList[idx].totalPurchasePrice?.toString()) +
              parseFloat(price.toString())
            : parseFloat(price.toString());
          itemList[idx].purchaseQty = itemList[idx].purchaseQty
            ? parseInt(itemList[idx].purchaseQty?.toString()) +
              parseInt(r.qty.toString())
            : parseInt(r.qty.toString());
        }
      }
    });
    let company: Company = await this.storageService.get(Company.storageKey);
    let currency = company?.currency ? company?.currency : '';
    itemList.forEach(async (i, idx) => {
      let item: any = await this.databaseService.getItems(i.itemId);
      itemList[idx] = {
        ...itemList[idx],
        ...item[0],
        totalSalesPrice: itemList[idx]?.totalSalesPrice
          ? `${currency}` +
            ` ${itemList[idx]?.totalSalesPrice.toLocaleString()}`
          : undefined,
        totalPurchasePrice: itemList[idx]?.totalPurchasePrice
          ? `${currency}` +
            ` ${itemList[idx]?.totalPurchasePrice.toLocaleString()}`
          : undefined,
      };
    });
    return itemList;
  }

  async getCustomerReport(res: any) {
    let customerList: any[] = [];
    res.forEach(async (r) => {
      let idx = customerList.findIndex((i) => i.customerId == r.customerId);
      if (idx == -1) {
        let payment = r.payment;
        let credit = r.change;
        let item = {
          customerName: r.customerName,
          customerId: r.customerId,
          payment: payment,
          credit: credit,
        };
        if (r.isCredit == 0) delete item.credit;
        else delete item.payment;
        customerList.push(item);
      } else {
        let payment = r.payment;
        let credit = r.change;
        customerList[idx] = {
          ...customerList[idx],
          payment: customerList[idx].payment
            ? parseFloat(customerList[idx].payment?.toString()) +
              parseFloat(payment.toString())
            : parseFloat(payment.toString()),
        };
        if (customerList[idx].isCredit == 1) {
          let totalCredit = customerList[idx].credit
            ? parseFloat(customerList[idx].credit?.toString()) +
              parseFloat(credit.toString())
            : parseFloat(credit.toString());
          customerList[idx].credit = totalCredit;
        }
      }
    });
    let company: Company = await this.storageService.get(Company.storageKey);
    let currency = company?.currency ? company?.currency : '';
    customerList.forEach(async (i, idx) => {
      customerList[idx] = {
        ...customerList[idx],
        payment: customerList[idx]?.payment
          ? `${currency}` + ` ${customerList[idx]?.payment.toLocaleString()}`
          : undefined,
        credit: customerList[idx]?.credit
          ? `${currency}` + ` ${customerList[idx]?.credit.toLocaleString()}`
          : undefined,
      };
    });
    return customerList;
  }

  async back() {
    await this.router.navigate(['/tabs/tab1/']);
  }
}
