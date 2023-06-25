import { Component } from '@angular/core';
import { CommonService } from 'src/services/common.service';
import { ScanService } from 'src/services/scan.service';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
})
export class Tab2Page {
  result: string | undefined;

  constructor(
    public scanService: ScanService,
    public commonService: CommonService
  ) {}
}
