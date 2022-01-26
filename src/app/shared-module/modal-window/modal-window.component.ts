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

const MODAL_TYPES = {
  CONFIRM: 'CONFIRM',
  INFO: 'INFO',
  SETTINGS: 'SETTINGS',
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

  @Input() title: string = '';
  @Input() text: string = '';
  @Input() btnConfirmText: string = '';
  @Input() btnCloseText: string = '';
  @Input() modalType!: keyof typeof MODAL_TYPES;

  @Output() closeEvent = new EventEmitter<boolean>();

  modalRef!: BsModalRef;
  subscriptions: Subscription[] = [];

  constructor(private modalService: BsModalService) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.modalService.onHide.subscribe((reason: string | any) => {
        if (reason === 'backdrop-click' || reason === 'esc') {
          this.close(false, false);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }

  close(confirm: boolean, hide: boolean = true) {
    if (hide) {
      this.modalRef.hide();
    }

    this.closeEvent.emit(confirm);
  }

  ngAfterViewInit() {
    if (this.modalType === MODAL_TYPES.SETTINGS) {
      this.modalRef = this.modalService.show(this.templateSettings);
      return;
    }
    if (this.title) {
      this.modalRef = this.modalService.show(this.template);
    } else {
      this.modalRef = this.modalService.show(this.templateSimple);
    }
  }
}
