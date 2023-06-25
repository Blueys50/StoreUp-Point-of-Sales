import { Component, OnInit } from '@angular/core';
import { ScanService } from 'src/services/scan.service';

@Component({
  selector: 'scan-view',
  templateUrl: './scan.component.html',
  styleUrls: ['./scan.component.scss'],
})
export class ScanComponent implements OnInit {
  constructor(public scanService: ScanService) {}

  ngOnInit() {
    document.addEventListener(
      'backbutton',
      this.handleCancelScanner.bind(this)
    );
  }

  ngOnDestroy() {
    document.removeEventListener(
      'backbutton',
      this.handleCancelScanner.bind(this)
    );
  }

  handleCancelScanner(event: Event) {
    this.scanService.stopScanner();
  }
}
