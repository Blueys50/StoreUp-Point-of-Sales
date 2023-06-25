import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Tab5Page } from './tab5.page';
import { ExploreContainerComponentModule } from '../explore-container/explore-container.module';

import { Tab5PageRoutingModule } from './tab5-routing.module';
import { SettingViewComponent } from './setting-view/setting-view.component';
import { FormFieldsModule } from '../component/form-fields/form-fields.module';
import { BluetoothSerial } from '@ionic-native/bluetooth-serial/ngx';
import { ChoosePrinterComponent } from './setting-view/choose-printer/choose-printer.component';
import { ModalComponentModule } from '../component/modal-component/modal-component.module';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ExploreContainerComponentModule,
    Tab5PageRoutingModule,
    ReactiveFormsModule,
    FormFieldsModule,
    ModalComponentModule,
  ],
  declarations: [Tab5Page, SettingViewComponent, ChoosePrinterComponent],
  providers: [BluetoothSerial],
})
export class Tab5PageModule {}
