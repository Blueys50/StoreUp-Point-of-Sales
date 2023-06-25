import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Tab1Page } from './tab1.page';
import { ExploreContainerComponentModule } from '../explore-container/explore-container.module';

import { Tab1PageRoutingModule } from './tab1-routing.module';
import { ActionMenuComponent } from './action-menu/action-menu.component';
import { CashierPageComponent } from './cashier-page/cashier-page.component';
import { IconPopoverModule } from '../component/icon-popover/icon-popover.module';
import { IonIconWrapperModule } from '../component/ion-icon-wrapper/ion-icon-wrapper.module';
import { CashierDetailComponent } from './cashier-page/cashier-detail/cashier-detail.component';
import { ModalComponentModule } from '../component/modal-component/modal-component.module';
import { FormFieldsModule } from '../component/form-fields/form-fields.module';
import { CustomerPageComponent } from './customer-page/customer-page.component';
import { CustomerDetailComponent } from './customer-page/customer-detail/customer-detail.component';
import { PaymentMethodPageComponent } from './payment-method-page/payment-method-page.component';
import { PaymentMethodDetailComponent } from './payment-method-page/payment-method-detail/payment-method-detail.component';
import { ActionReportComponent } from './action-menu/action-report/action-report.component';
import { NgPqTableModule } from 'ngpq-table';
import { ScreenOrientation } from '@ionic-native/screen-orientation/ngx';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FormFieldsModule,
    ExploreContainerComponentModule,
    Tab1PageRoutingModule,
    IonIconWrapperModule,
    IconPopoverModule,
    ModalComponentModule,
    NgPqTableModule,
  ],
  declarations: [
    Tab1Page,
    ActionMenuComponent,
    CashierPageComponent,
    CashierDetailComponent,
    CustomerPageComponent,
    CustomerDetailComponent,
    PaymentMethodPageComponent,
    PaymentMethodDetailComponent,
    ActionReportComponent,
  ],
  providers: [ScreenOrientation],
})
export class Tab1PageModule {}
