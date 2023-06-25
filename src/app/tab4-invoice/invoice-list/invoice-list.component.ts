import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ModalController, ToastController } from '@ionic/angular';
import { endOfDay, isAfter, isBefore, startOfDay } from 'date-fns';
import { CellData, RowData, Settings } from 'ngpq-table';
import { PaymentPageComponent } from 'src/app/tab3/payment-page/payment-page.component';
import { Customer } from 'src/models/customer';
import { salesHeader } from 'src/models/salesHeader';
import { CommonService } from 'src/services/common.service';
import { DatabaseService } from 'src/services/database.service';

@Component({
  selector: 'invoice-list',
  templateUrl: './invoice-list.component.html',
  styleUrls: ['./invoice-list.component.scss'],
})
export class InvoiceListComponent implements OnInit {
  dataSource: string | salesHeader[];
  sortBy: string = 'createdDate';
  columnConfig;
  settings: { [key: string]: Settings };
  data: any[];
  showTable: boolean;
  isSales: boolean = true;
  startDate: string;
  endDate: string;
  constructor(
    private databaseService: DatabaseService,
    private modalController: ModalController,
    public commonService: CommonService,
    private toastController: ToastController
  ) {}

  async ngOnInit() {
    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().slice(0, 10);
    this.startDate = formattedDate;
    this.endDate = formattedDate;
    this.data = await this.getRes();
    this.settings = this.getSalesTable();
    this.showTable = true;
  }
  getSalesTable(): { [key: string]: Settings } {
    return {
      salesHeaderId: {
        title: 'id',
        width: '50px',
        disableSort: true,
      },
      createdDateFormatted: {
        title: 'createdDate',
        width: '200px',
        disableSort: true,
      },
      customerName: {
        title: 'customer',
        width: '200px',
        disableSort: true,
      },
      totalPrice: {
        title: 'totalPrice',
        width: '200px',
        disableSort: true,
      },
      status: {
        title: 'Status',
        width: '200px',
        disableSort: true,
      },
      createdByCashier: {
        title: 'cashier',
        width: '200px',
        disableSort: true,
      },
    };
  }

  async generateReport() {
    let valid = this.checkDateValidation();
    if (valid) {
      this.data = await this.getRes();
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
    this.isSales = !this.isSales;
    if (this.isSales) {
      await this.refreshSales();
    } else {
      await this.refreshPurchase();
    }
    this.showTable = true;
  }
  async refreshPurchase() {
    this.data = await this.getRes();
    this.settings = {
      purchaseHeaderId: {
        title: 'id',
        width: '50px',
        disableSort: true,
      },
      createdDateFormatted: {
        title: 'createdDate',
        width: '200px',
        disableSort: true,
      },
      totalPrice: {
        title: 'totalPrice',
        width: '200px',
        disableSort: true,
      },
      status: {
        title: 'status',
        width: '200px',
        disableSort: true,
      },
      createdByCashier: {
        title: 'cashier',
        width: '200px',
        disableSort: true,
      },
    };
  }
  async refreshSales() {
    this.data = await this.getRes();
    this.settings = this.getSalesTable();
  }

  async editInvoice(e: any) {
    let title = `Change ${'type'}`;
    let modal = await this.modalController.create({
      component: PaymentPageComponent,
      componentProps: {
        modalTitle: title,
        salesHeader: this.isSales ? e.row : '',
        purchaseHeader: !this.isSales ? e.row : '',
      },
      cssClass: 'auto-height no-padding-top no-inner-padding',
    });
    await modal.present();
    let data = await modal.onDidDismiss();
    this.showTable = false;
    if (this.isSales) {
      await this.refreshSales();
    } else {
      await this.refreshPurchase();
    }
    this.showTable = true;
  }

  async getRes() {
    let res;
    if (this.isSales) {
      res = await this.databaseService.getSalesHeader({
        startDate: startOfDay(new Date(this.startDate)),
        endDate: endOfDay(new Date(this.endDate)),
        showOnlyId: this.commonService.customer?.customerId,
      });
    } else {
      res = await this.databaseService.getPurchaseHeader({
        startDate: startOfDay(new Date(this.startDate)),
        endDate: endOfDay(new Date(this.endDate)),
      });
    }
    res = res.map((r) => {
      return {
        ...r,
        status: r.isCredit ? 'Credit' : 'Paid',
      };
    });
    res = res.sort((a, b) => {
      if (this.sortBy == 'createdDate') {
        return this.getCompareResult(a.createdDate, b.createdDate);
      } else if (this.sortBy == 'totalPrice') {
        return this.getCompareResult(a.totalPrice, b.totalPrice);
      }
      return this.getCompareResult(a.isCredit, b.isCredit);
    });
    if (this.sortBy == 'createdDate') {
      return res.reverse();
    }
    return res;
  }
  getCompareResult(a, b): number {
    if (a < b) {
      return 1;
    }

    if (a > b) {
      return -1;
    }

    return 0;
  }

  async removeCustomer() {
    this.commonService.customer = undefined;
    this.data = await this.getRes();
  }
}
