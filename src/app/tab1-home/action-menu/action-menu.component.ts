import { Component, Inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { User } from '@codetrix-studio/capacitor-google-auth';
import {
  AlertController,
  AnimationBuilder,
  LoadingController,
  Platform,
  ToastController,
} from '@ionic/angular';
import { DatabaseService } from 'src/services/database.service';
import { GoogleService } from 'src/services/google.service';
import { StorageService } from 'src/services/storage.service';
import { ScreenOrientation } from '@ionic-native/screen-orientation/ngx';

@Component({
  selector: 'action-menu',
  templateUrl: './action-menu.component.html',
  styleUrls: ['./action-menu.component.scss'],
})
export class ActionMenuComponent implements OnInit {
  constructor(
    private router: Router,
    private googleService: GoogleService,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private alertController: AlertController,
    private databaseService: DatabaseService,
    private screenOrientation: ScreenOrientation,
    private databaservice: DatabaseService
  ) {}

  async ngOnInit() {
    let loading = await this.loadingController.create();
    loading.present();
    await this.databaservice.createDatabase(true);
    try {
      await this.screenOrientation.lock(
        this.screenOrientation.ORIENTATIONS.PORTRAIT
      );
      console.log('Screen orientation locked to portrait');
    } catch (error) {
      console.error('Failed to lock screen orientation:', error);
    }
    loading.dismiss();
  }

  async goCashierPage() {
    this.router.navigate(['/tabs/tab1/cashier']);
  }

  goCustomerPage() {
    this.router.navigate(['/tabs/tab1/customer']);
  }

  goPaymentMethodPage() {
    this.router.navigate(['/tabs/tab1/payment-method']);
  }

  async backupData(uploadBackup: boolean) {
    let user: User = await this.googleService.getUser();
    if (user?.authentication?.accessToken) {
      let validToken = await this.googleService.checkToken();
      if (validToken) {
        await this.backupAlert(user, uploadBackup);
      } else {
        await this.googleService.signIn();
        user = await this.googleService.getUser(true);
        await this.backupAlert(user, uploadBackup);
      }
    } else {
      alert('Please login first');
    }
  }
  async backupAlert(user: User, uploadBackup: boolean) {
    const alert = await this.alertController.create({
      header: `Are you sure you want to ${
        uploadBackup
          ? ' backup your data?'
          : ' use a database in your google drive?'
      }`,
      message: `${
        uploadBackup
          ? 'It will overwrite your old database in google drive if there is any.'
          : 'It will overwrite the currrent database in your phone.'
      }`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {},
        },
        {
          text: 'Confirm',
          handler: () => {
            if (uploadBackup) {
              this.startBackupData(user);
            } else {
              this.usebackupData(user);
            }
          },
        },
      ],
    });
    await alert.present();
  }

  async usebackupData(user: User) {
    let ld = await this.loadingController.create();
    await ld.present();
    let fileId = await this.googleService.checkFile(
      user.authentication.accessToken
    );
    if (fileId) {
      await this.googleService.getFileContentFromDrive(fileId, user);
      this.makeToast('Using backup Success');
    } else {
      alert('No backup available');
    }
    await ld.dismiss();
  }

  async startBackupData(user: User) {
    let ld = await this.loadingController.create();
    await ld.present();
    let currentDate = new Date();
    let iso8601Date = currentDate.toISOString();
    await this.googleService.uploadFileToDrive(
      iso8601Date,
      user.authentication.accessToken
    );
    console.log('upload done');
    await this.databaseService.updateLastBackup(iso8601Date);
    console.log('backuop done');
    await ld.dismiss();
    this.makeToast('Backup success');
  }

  async makeToast(message) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      buttons: [{ text: 'DONE', role: 'cancel' }],
    });
    toast.present();
  }

  async goCashierReport() {
    this.router.navigate(['/tabs/tab1/action-report'], {
      queryParams: { isItem: true },
    });
  }

  async goCustomerReport() {
    this.router.navigate(['/tabs/tab1/action-report'], {});
  }
}
