import { Component } from '@angular/core';
import { CommonService } from 'src/services/common.service';
import { ScanService } from 'src/services/scan.service';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
})
export class TabsPage {
  constructor(
    public scanService: ScanService,
    private commonService: CommonService
  ) {}

  handleTabChange(event: any) {
    this.commonService.showInvoiceReport = false;
    this.commonService.showSetting = false;
    this.commonService.showPayment = false;
    this.commonService.showStorage = false;
    if (event.tab == 'tab4') {
      this.commonService.showInvoiceReport = true;
    }
    if (event.tab == 'tab3') {
      this.commonService.showPayment = true;
    }
    if (event.tab == 'tab5') {
      this.commonService.showSetting = true;
    }
    if (event.tab == 'tab2') {
      this.commonService.showStorage = true;
    }
  }
}
