import { Component, Input, OnInit } from "@angular/core";

@Component({
  selector: "ion-icon-wrapper",
  template: `<ion-icon
    [class.disabled]="disabled"
    [name]="name"
    [color]="color"
    [size]="size"
    [src]="src"
  ></ion-icon> `,
  styles: [
    `
      ion-icon {
        pointer-events: none;
        color: inherit;
        size: inherit;
      }
      ion-icon.disabled {
        pointer-events: all;
        cursor: default !important;
        color: var(--ion-color-disabled);
      }
    `,
  ],
})
export class IonIconWrapperComponent implements OnInit {
  @Input() name: string;
  @Input() color: string;
  @Input() size: string;
  @Input() src: string;
  @Input() disabled: boolean = false;

  constructor() {}

  ngOnInit() {}
}
