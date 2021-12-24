import {
  Component,
  OnInit,
  Input,
  TemplateRef,
  ViewChild,
  EventEmitter,
  Output,
} from '@angular/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

const MODAL_TYPES = {
  CONFIRM: 'CONFIRM',
  INFO: 'INFO',
};

@Component({
  selector: 'modal-window',
  templateUrl: './modal-window.component.html',
  styleUrls: ['./modal-window.component.scss'],
})
export class ModalWindowComponent implements OnInit {
  @ViewChild('template') template!: TemplateRef<any>;

  @Input() title: string = '';
  @Input() text: string = '';
  @Input() btnConfirmText: string = '';
  @Input() btnCloseText: string = '';
  @Input() modalType!: keyof typeof MODAL_TYPES;

  @Output() closeEvent = new EventEmitter<boolean>();

  modalRef!: BsModalRef;
  constructor(private modalService: BsModalService) {}

  close(confirm: boolean) {
    this.modalRef.hide();
    this.closeEvent.emit(confirm);
  }

  ngOnInit(): void {}
  ngAfterViewInit() {
    this.modalRef = this.modalService.show(this.template);
  }
}
