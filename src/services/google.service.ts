import { Injectable } from '@angular/core';
import { GoogleAuth, User } from '@codetrix-studio/capacitor-google-auth';
import {
  LoadingController,
  ModalController,
  ToastController,
  isPlatform,
} from '@ionic/angular';
import { Plugins } from '@capacitor/core';
import { StorageService } from './storage.service';
import { googleAccount } from 'src/models/googleAccount';
import { DatabaseService } from './database.service';
import { Company } from 'src/models/company';
import { Setting } from 'src/models/settings';
import { isAfter, isBefore } from 'date-fns';
const { Drive } = Plugins;

@Injectable({
  providedIn: 'root',
})
export class GoogleService {
  user: User | any;
  fileName = 'StoreUpDB.json';

  constructor(
    private toastController: ToastController,
    private storageService: StorageService,
    private databaseService: DatabaseService,
    private ldCtrl: LoadingController
  ) {
    if (!isPlatform('capacitor')) {
      GoogleAuth.initialize();
    }
  }

  async signIn() {
    let user = await GoogleAuth.signIn();
    if (!user.authentication?.accessToken) {
      this.makeToast('Login Failed');
    } else {
      this.storageService.set(googleAccount.storageKey, user);
      this.user = user;
    }
  }

  async getUser(afterRefresh?: boolean) {
    if (afterRefresh) {
      return this.user;
    }
    if (!this.user) {
      this.user = await this.storageService.get(googleAccount.storageKey);
    }
    return this.user;
  }

  async refresh() {
    const authCode = await GoogleAuth.refresh();
    this.user.authentication = authCode;
    this.storageService.set(googleAccount.storageKey, this.user);
  }

  async signOut() {
    await GoogleAuth.signOut();
    this.user = undefined;
    this.storageService.set(googleAccount.storageKey, '');
  }

  async uploadFileToDrive(date, token) {
    const metadata = {
      name: this.fileName,
      mimeType: 'application/json',
    };

    let cashiers: any = await this.databaseService.getCashiers();
    let customers: any = await this.databaseService.getCustomer();
    let paymentMethod: any = await this.databaseService.getPaymentMethod();
    let itemList: any = await this.databaseService.getItems();
    let packs: any = await this.databaseService.getPackage();
    let multiPrice: any = await this.databaseService.getMultiPrice();
    let wholeSalePrice: any = await this.databaseService.getWholesalePrice();
    let salesHeader: any = await this.databaseService.getSalesHeader(
      undefined,
      true
    );
    let salesDetail: any = await this.databaseService.getSalesDetail();
    let purchaseHeader: any = await this.databaseService.getPurchaseHeader(
      undefined,
      true
    );
    let purchaseDetail: any = await this.databaseService.getPurchaseDetail();
    let company: any = await this.storageService.get(Company.storageKey);
    let setting: any = await this.storageService.get(Setting.storageKey);

    const datasets: any[] = [
      {
        type: 'cashiers',
        content: cashiers.map((c) => {
          return {
            ...c,
            lastBackupDate: date,
          };
        }),
      },
      { type: 'customers', content: customers },
      { type: 'paymentMethod', content: paymentMethod },
      { type: 'items', content: itemList },
      { type: 'multiPrice', content: multiPrice },
      { type: 'package', content: packs },
      { type: 'wholesalePrice', content: wholeSalePrice },
      { type: 'salesHeader', content: salesHeader },
      { type: 'salesDetail', content: salesDetail },
      { type: 'purchaseHeader', content: purchaseHeader },
      { type: 'purchaseDetail', content: purchaseDetail },
      { type: 'company', content: company },
      { type: 'setting', content: setting },
    ];

    console.log(datasets);

    // Convert the JSON object to a string and create a new Blob
    const blob = new Blob([JSON.stringify(datasets)], {
      type: 'application/json',
    });

    // Create a new File object with the desired name and the contents of the Blob
    const file = new File([blob], this.fileName, {
      type: 'application/json',
    });

    // Create a new FormData object and append the metadata and file to it
    const formData = new FormData();
    formData.append(
      'metadata',
      new Blob([JSON.stringify(metadata)], { type: 'application/json' })
    );
    formData.append('file', file);
    let fileId = await this.checkFile(token);
    if (!fileId) {
      // Make a POST request to the Google Drive API to upload the file
      const response = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );
      // Parse the response and return the file ID
      const data = await response.json();
      return data.id;
    } else {
      fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      )
        .then((response) => {
          if (!response.ok) {
            throw new Error(
              `Failed to update file: ${response.status} ${response.statusText}`
            );
          }
          return response.json();
        })
        .then((data) => {
          console.log('File updated:', data);
        })
        .catch((error) => {
          console.error('Error updating file:', error);
        });
    }
  }

  async checkFile(token) {
    const queryParams = new URLSearchParams({
      q: `name='${this.fileName}' and trashed=false`,
      fields: 'files(id)',
      access_token: token,
    });

    // Make a GET request to the Drive API's files endpoint with the query parameters
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?${queryParams}`
    );
    const data = await response.json();
    // Extract the fileId from the response
    const fileId = data?.files[0]?.id;
    return fileId;
  }

  async checkToken() {
    let account = await this.storageService.get(googleAccount.storageKey);
    if (account) {
      const expiredDate = new Date(
        parseInt(account.authentication.expires) * 1000
      );
      const dateNow = new Date();
      return isBefore(dateNow, expiredDate);
    }
    return true;
  }

  async getFileContentFromDrive(fileId, user) {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const headers = new Headers();
    let token = user.authentication.accessToken;
    let tables;
    headers.append('Authorization', `Bearer ${token}`);

    let a = await fetch(url, { headers })
      .then((response) => response.text())
      .then((fileContent) => {
        tables = JSON.parse(fileContent);
      })
      .catch((error) => {
        console.error('Error retrieving file content:', error);
      });
    if (tables) {
      tables.reverse().forEach(async (tables) => {
        await this.databaseService.dropTables(tables.type);
      });
      await this.databaseService.createTables(true);
      tables.reverse().forEach(async (table) => {
        if (table.name == 'company') {
          this.storageService.set(Company.storageKey, table.content);
        }
        if (table.name == 'setting') {
          this.storageService.set(Setting.storageKey, table.content);
        } else {
          if (table.content?.length > 0) {
            table.content?.forEach(async (c) => {
              await this.databaseService.addBackupData(table.type, c);
            });
          }
        }
      });
    }
  }
  async makeToast(message) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      buttons: [{ text: 'DONE', role: 'cancel' }],
    });
    toast.present();
  }
}
