import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { BluetoothPrinterService } from 'src/services/bluetoothPrinter.service';

@Component({
  selector: 'choose-printer',
  templateUrl: './choose-printer.component.html',
  styleUrls: ['./choose-printer.component.scss'],
})
export class ChoosePrinterComponent implements OnInit {
  @Input() modalTitle: string;
  @Input() printer;
  bluetoothList: any;
  selectedPrinter;
  constructor(
    private printService: BluetoothPrinterService,
    private modalController: ModalController
  ) {}

  async ngOnInit() {
    await this.refresh();
  }

  async refresh() {
    let res = await this.printService.checkBluetoothOnlineStatus();
    if (res == 'OK') {
      await this.printService.searchBluetoothPrinter().then((resp) => {
        this.bluetoothList = resp;
      });
    } else {
      alert('Please turn on Bluetooth');
    }
  }
  async cancel() {
    await this.modalController.dismiss();
  }

  async addPrinter() {
    this.modalController.dismiss(this.selectedPrinter);
  }

  selectPrinter(i) {
    this.selectedPrinter = i;
  }
}
