import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Tab3Page } from './tab3.page';
import { ExploreContainerComponentModule } from '../explore-container/explore-container.module';

import { Tab3PageRoutingModule } from './tab3-routing.module';
import { IconPopoverModule } from '../component/icon-popover/icon-popover.module';
import { IonIconWrapperModule } from '../component/ion-icon-wrapper/ion-icon-wrapper.module';
import { ModalComponentModule } from '../component/modal-component/modal-component.module';
import { FormFieldsModule } from '../component/form-fields/form-fields.module';
import { PaymentPageComponent } from './payment-page/payment-page.component';
import { scanModule } from '../component/scan/scan.module';
import { PaymentItemDetailComponent } from './payment-page/payment-item-detail/payment-item-detail.component';
import { ChangingChangeableFieldComponent } from './payment-page/changing-changeable-field/changing-changeable-field.component';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ExploreContainerComponentModule,
    Tab3PageRoutingModule,
    IconPopoverModule,
    ModalComponentModule,
    IonIconWrapperModule,
    FormsModule,
    ReactiveFormsModule,
    FormFieldsModule,
    scanModule,
  ],
  declarations: [
    Tab3Page,
    PaymentPageComponent,
    PaymentItemDetailComponent,
    ChangingChangeableFieldComponent,
  ],
})
export class Tab3PageModule {}
