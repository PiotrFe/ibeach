import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { trigger, style, animate, transition } from '@angular/animations';

@Component({
  template: '',
  animations: [
    trigger('insertRemoveTrigger', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('180ms', style({ opacity: 1 })),
      ]),
      transition(':leave', [animate('180ms', style({ opacity: 0 }))]),
    ]),
  ],
})
export class HeaderComponent {
  @Input() sortable: boolean = false;
  @Input() currentSort!: { field: string; order: number };

  @Input() entryContainerWidth!: number;

  @Output() newSortEvent = new EventEmitter<string>();

  constructor() {}

  handleClick(val: string) {
    if (this.sortable) {
      this.newSortEvent.emit(val);
    }
  }

  getSort(colName: string, order: number): boolean {
    if (!this.sortable) {
      return false;
    }
    if (this.currentSort.field === colName) {
      return this.currentSort.order === order;
    }
    return false;
  }
}
