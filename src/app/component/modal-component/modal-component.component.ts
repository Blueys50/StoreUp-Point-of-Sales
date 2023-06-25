import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { ModalController } from "@ionic/angular";

@Component({
  selector: "modal-component",
  templateUrl: "./modal-component.component.html",
  styleUrls: ["./modal-component.component.scss"],
})
export class ModalComponent implements OnInit {
  @Input() modalTitle: string;
  @Input() closeData: any;
  @Input() modalPadding: string = "1.5em";
  @Input() titleTextCenter: boolean = false;
  @Input() resizeHeader: boolean = false;
  @Output() closeModal = new EventEmitter<any>();

  constructor(private modalController: ModalController) {}

  close() {
    if (this.closeModal.observers.length) {
      this.closeModal.emit();
    } else {
      this.modalController.dismiss(this.closeData);
    }
  }

  ngOnInit() {}
}
