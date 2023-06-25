import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { IonicModule } from "@ionic/angular";
import { IonIconWrapperComponent } from "./ion-icon-wrapper.component";

@NgModule({
  imports: [CommonModule, IonicModule],
  declarations: [IonIconWrapperComponent],
  exports: [IonIconWrapperComponent],
})
export class IonIconWrapperModule {}
