import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Tab4Page } from './tab4.page';
import { ExploreContainerComponentModule } from '../explore-container/explore-container.module';

import { Tab4PageRoutingModule } from './tab4-routing.module';
import { InvoiceListComponent } from './invoice-list/invoice-list.component';
import { NgPqTableModule } from 'ngpq-table';
import { IconPopoverModule } from '../component/icon-popover/icon-popover.module';
import { IonIconWrapperModule } from '../component/ion-icon-wrapper/ion-icon-wrapper.module';
import { ModalComponentModule } from '../component/modal-component/modal-component.module';
import { FormFieldsModule } from '../component/form-fields/form-fields.module';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ExploreContainerComponentModule,
    Tab4PageRoutingModule,
    NgPqTableModule,
    IconPopoverModule,
    ModalComponentModule,
    IonIconWrapperModule,
    FormFieldsModule,
    ReactiveFormsModule,
  ],
  declarations: [Tab4Page, InvoiceListComponent],
})
export class Tab4PageModule {}
