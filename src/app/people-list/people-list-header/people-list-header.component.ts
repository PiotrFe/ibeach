import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'people-list-header',
  templateUrl: './people-list-header.component.html',
  styleUrls: ['./people-list-header.component.scss'],
})
export class PeopleListHeaderComponent implements OnInit {
  @Output() newSortEvent = new EventEmitter<string>();
  @Input() sortable: boolean = false;
  @Input() currentSort!: { field: string; order: number };

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
