import { Component } from '@angular/core';
import { CommonService } from 'src/services/common.service';

@Component({
  selector: 'app-tab5',
  templateUrl: 'tab5.page.html',
  styleUrls: ['tab5.page.scss'],
})
export class Tab5Page {
  constructor(public commonService: CommonService) {}

  // async signIn(){
  //   await this.googleService.signIn();
  // }
}
