import {
  Component,
  ElementRef,
  Input,
  OnDestroy,
  ViewChild,
} from "@angular/core";
import tippy, { Instance } from "tippy.js";

@Component({
  selector: "icon-popover",
  template: `
    <ion-icon-wrapper #icon [name]="name" [src]="src"></ion-icon-wrapper>
    <div #container (click)="hideOnClick()">
      <ng-content></ng-content>
    </div>
  `,
  styles: ["ion-icon-wrapper { font-size: 20px; }"]
})
export class IconPopover implements OnDestroy {
  // TODO: Replace icon-popover module with tippy-popover module.
  @ViewChild("icon", { read: ElementRef }) icon: ElementRef;
  @ViewChild("container") container: ElementRef;

  @Input() name: string = "ellipsis-horizontal";
  @Input() src: string;
  @Input() tooltip: boolean = false;
  @Input() options: any = {};

  tippyInstance: Instance;

  ngAfterViewInit() {
    let tooltip = this.tooltip !== false;
    let options = {
      content: this.container.nativeElement,
      placement: tooltip ? "auto" : "bottom-end",
      trigger: tooltip ? "mouseenter focus" : "click",
      interactive: true,
      appendTo: document.body,
      arrow: true,
      animation: tooltip ? "fade" : "perspective",
      offset: tooltip ? [0, 10] : [0, 3],
      hideOnClick: true,
      ...this.options,
    };
    this.tippyInstance = (tippy(
      this.icon.nativeElement,
      options
    ) as any) as Instance;
  }

  ngOnDestroy() {
    this.hideOnClick();
  }

  hideOnClick() {
    if (this.tippyInstance.props.hideOnClick) {
      this.tippyInstance.hide();
    }
  }
}
