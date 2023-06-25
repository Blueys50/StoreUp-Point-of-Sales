import { FormBuilder, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ModalComponent} from './modal-component.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [
    ModalComponent
  ],
  imports: [
    CommonModule,
    IonicModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule
  ],
  exports: [
    ModalComponent
  ]
})
export class ModalComponentModule { }
