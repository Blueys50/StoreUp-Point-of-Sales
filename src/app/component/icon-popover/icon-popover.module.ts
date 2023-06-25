import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { IonIconWrapperModule } from "../ion-icon-wrapper/ion-icon-wrapper.module";
import { IconPopover } from "./icon-popover.component";

@NgModule({
  declarations: [IconPopover],
  imports: [CommonModule, IonIconWrapperModule],
  exports: [IconPopover],
})
export class IconPopoverModule {}
