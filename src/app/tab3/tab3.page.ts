import { Component } from '@angular/core';
import { CommonService } from 'src/services/common.service';
import { DatabaseService } from 'src/services/database.service';
import { GoogleService } from 'src/services/google.service';
import { ScanService } from 'src/services/scan.service';
import { StorageService } from 'src/services/storage.service';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
})
export class Tab3Page {
  constructor(
    public scanService: ScanService,
    public commonService: CommonService
  ) {}
}
