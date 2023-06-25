import { Component, Host, Input, Optional, SkipSelf } from "@angular/core";
import {
  ControlContainer,
  FormControl,
  NG_VALUE_ACCESSOR,
} from "@angular/forms";

@Component({
  selector: "form-field-error",
  template: `
    <div class="error-message" *ngIf="control?.touched && control?.errors">
      <div *ngFor="let errorMsg of getErrorMessages()">
        {{ errorMsg }}
      </div>
    </div>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: FormFieldError,
      multi: true,
    },
  ],
})
export class FormFieldError {
  @Input() control: FormControl | any;

  constructor(
    @Optional()
    @Host()
    @SkipSelf()
    private controlContainer: ControlContainer
  ) {}

  ngOnInit() {
    if (!this.control && this.controlContainer) {
      this.control = this.controlContainer.control as FormControl;
    }
  }

  formatError(errorKey, data) {
    if (errorKey.indexOf("may not be null") >= 0)
      return "This field is required";
    if (errorKey.indexOf(" ") >= 0) return errorKey;
    switch (errorKey) {
      case "required":
        return "This field is required";
      case "minlength":
        return `At least ${data.requiredLength} characters are required`;
      case "maxlength":
        return `The maximum of characters required is ${data.requiredLength}`;
      case "min":
        return `The minimum value is ${data.min}`;
      case "max":
        return `The maximum  value is ${data.max}`;
      case "email":
        return "Please enter a valid email address";
      case "reducedQuantity":
        return "Quantity should be a positive number";
      default:
        return "This field is invalid";
    }
  }

  getErrorMessages() {
    let controlErrors = this.control.errors;
    let errorMsgs:any = [];
    for (let key in controlErrors) {
      let val = controlErrors[key];
      errorMsgs.push(this.formatError(key, val));
    }
    return errorMsgs;
  }
}
