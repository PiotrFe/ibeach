import {
  Component,
  OnInit,
  Input,
  TemplateRef,
  ViewChild,
  EventEmitter,
  Output,
  OnDestroy,
} from '@angular/core';

import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { Subscription } from 'rxjs';

export const MODAL_TYPES = {
  CONFIRM: 'CONFIRM',
  INFO: 'INFO',
  SETTINGS: 'SETTINGS',
  INPUT_SMALL: 'INPUT_SMALL',
};

@Component({
  selector: 'modal-window',
  templateUrl: './modal-window.component.html',
  styleUrls: ['./modal-window.component.scss'],
})
export class ModalWindowComponent implements OnInit, OnDestroy {
  @ViewChild('template') template!: TemplateRef<any>;
  @ViewChild('templateSimple') templateSimple!: TemplateRef<any>;
  @ViewChild('templateSettings') templateSettings!: TemplateRef<any>;
  @ViewChild('templateInputSmall') templateInputSmall!: TemplateRef<any>;

  @Input() title: string = '';
  @Input() text: string = '';
  @Input() btnConfirmText: string = '';
  @Input() btnCloseText: string = '';
  @Input() modalType!: keyof typeof MODAL_TYPES;
  @Input() hideOnBackdropClick: boolean = true;
  @Input() canSubmit: boolean = false;

  @Output() closeEvent = new EventEmitter<boolean>();

  modalRef!: BsModalRef;
  subscriptions: Subscription[] = [];

  constructor(private modalService: BsModalService) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.modalService.onHide.subscribe((reason: string | any) => {
        if (
          (reason === 'backdrop-click' || reason === 'esc') &&
          this.hideOnBackdropClick
        ) {
          this.close(false);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }

  close(submit: boolean, hide: boolean = true) {
    if (hide) {
      this.modalRef.hide();
    }

    this.closeEvent.emit(submit);
  }

  ngAfterViewInit() {
    if (this.modalType === MODAL_TYPES.SETTINGS) {
      this.modalRef = this.modalService.show(this.templateSettings);
      return;
    }
    if (this.modalType === MODAL_TYPES.INPUT_SMALL) {
      this.modalRef = this.modalService.show(this.templateInputSmall);
      return;
    }
    if (this.title) {
      this.modalRef = this.modalService.show(this.template);
    } else {
      this.modalRef = this.modalService.show(this.templateSimple);
    }
  }
}
