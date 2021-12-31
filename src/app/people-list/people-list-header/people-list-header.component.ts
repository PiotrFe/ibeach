import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { PAGE_SECTIONS } from '../../app.component';

@Component({
  selector: 'people-list-header',
  templateUrl: './people-list-header.component.html',
  styleUrls: ['./people-list-header.component.scss'],
})
export class PeopleListHeaderComponent implements OnInit {
  @Input() displayedIn!: 'SUBMIT' | 'ALLOCATE';
  @Input() sortable: boolean = false;
  @Input() currentSort!: { field: string; order: number };
  @Input() currPageSection!: keyof typeof PAGE_SECTIONS;

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

  ngOnInit(): void {}
}
