import { Injectable } from '@angular/core';
import { BluetoothSerial } from '@ionic-native/bluetooth-serial/ngx';

@Injectable({
  providedIn: 'root',
})
export class BluetoothPrinterService {
  constructor(public btSerial: BluetoothSerial) {}
  searchBluetoothPrinter() {
    return this.btSerial.list();
  }
  connectToBluetoothPrinter(macAddress) {
    return this.btSerial.connect(macAddress);
  }
  disconnectBluetoothPrinter() {
    return this.btSerial.disconnect();
  }
  checkBluetoothOnlineStatus() {
    return this.btSerial.enable().then((s) => {
      return s;
    });
  }

  async sendToBluetoothPrinter(macAddress, data_string) {
    try {
      let res = await this.checkBluetoothOnlineStatus();
      if (res == 'OK') {
        this.connectToBluetoothPrinter(macAddress).subscribe(
          (_) => {
            this.btSerial.write(data_string).then(
              (_) => {
                this.disconnectBluetoothPrinter();
              },
              (err) => {
                console.log(err);
              }
            );
          },
          (err) => {
            alert(
              'Can not connect to your printer, please turn it on or try with another printer'
            );
            console.log(err);
          }
        );
      }
    } catch (error) {
      alert('Please enable Bluetooth if want to print');
    }
  }
}
