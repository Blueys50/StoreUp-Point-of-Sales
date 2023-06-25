import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Tab2Page } from './tab2.page';
import { ExploreContainerComponentModule } from '../explore-container/explore-container.module';

import { Tab2PageRoutingModule } from './tab2-routing.module';
import { ItemDetailComponent } from './item-page/item-detail/item-detail.component';
import { ItemPageComponent } from './item-page/item-page.component';
import { IconPopoverModule } from '../component/icon-popover/icon-popover.module';
import { IonIconWrapperModule } from '../component/ion-icon-wrapper/ion-icon-wrapper.module';
import { ModalComponentModule } from '../component/modal-component/modal-component.module';
import { FormFieldsModule } from '../component/form-fields/form-fields.module';
import { ScanComponent } from '../component/scan/scan.component';
import { MultiPriceComponent } from './item-page/item-detail/multi-price/multi-price.component';
import { PackageComponent } from './item-page/item-detail/package/package.component';
import { WholesalePriceComponent } from './item-page/item-detail/wholesale-price/wholesale-price.component';
import { scanModule } from '../component/scan/scan.module';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FormFieldsModule,
    ExploreContainerComponentModule,
    Tab2PageRoutingModule,
    IonIconWrapperModule,
    IconPopoverModule,
    ModalComponentModule,
    scanModule,
  ],
  declarations: [
    Tab2Page,
    ItemDetailComponent,
    ItemPageComponent,
    MultiPriceComponent,
    PackageComponent,
    WholesalePriceComponent,
  ],
})
export class Tab2PageModule {}
