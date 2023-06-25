import { Component } from '@angular/core';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page {

  constructor() {
    this.changeColor()
  }

  changeColor() {
    // let toolBox= document.querySelector('.toolbar-container');
    // if(toolBox) toolBox.classList.add('green');
  }

}
