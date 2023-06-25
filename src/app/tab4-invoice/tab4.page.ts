import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonService } from 'src/services/common.service';

@Component({
  selector: 'app-tab4',
  templateUrl: 'tab4.page.html',
  styleUrls: ['tab4.page.scss'],
})
export class Tab4Page {
  constructor(public commonService: CommonService) {}
}
