import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { MODAL_TYPES } from 'src/app/shared-module/modal-window/modal-window.component';

@Component({
  selector: 'input-modal',
  templateUrl: './input-modal.component.html',
  styleUrls: ['./input-modal.component.scss'],
})
export class InputModalComponent implements OnInit {
  @Input() size!: 'SMALL' | 'MEDIUM' | 'LARGE';
  @Input() text!: string;
  @Output() closeEvent = new EventEmitter();

  modalType!: keyof typeof MODAL_TYPES;

  constructor() {}

  ngOnInit(): void {
    this.modalType = `INPUT_${this.size}` as keyof typeof MODAL_TYPES;
  }

  handleClose(): void {
    this.closeEvent.emit();
  }
}
