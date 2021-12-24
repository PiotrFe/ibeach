import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Person, PersonEntry } from '../person';
import { Week } from 'src/app/shared-module/week-days/week';

@Component({
  selector: 'person-entry',
  templateUrl: './person-entry.component.html',
  styleUrls: ['./person-entry.component.scss'],
})
export class PersonEntryComponent extends PersonEntry implements OnInit {
  @Input() idx!: number;
  @Input() person!: Person;
  @Input() inEditMode!: boolean;
  @Input() sortField!: string;
  @Input() editable: boolean = true;

  @Output() editEvent = new EventEmitter<number>();
  @Output() deleteEvent = new EventEmitter<number>();
  @Output() calendarChangeEvent = new EventEmitter<{
    calendarObj: Week;
    idx: number;
  }>();

  constructor() {
    super();
  }

  handleEdit(): void {
    this.editEvent.emit(this.idx);
  }

  handleDelete(): void {
    this.deleteEvent.emit(this.idx);
  }

  onCalendarChange(calendarObj: Week) {
    this.calendarChangeEvent.emit({ calendarObj, idx: this.idx });
  }

  getFieldClasses(fieldName: string): string {
    const baseClass = `person-${fieldName} tbl-row mr-12 flex flex-ctr-ver pl-3`;
    const sortedClass = fieldName === this.sortField ? ' sorted' : '';

    return `${baseClass}${sortedClass}`;
  }

  ngOnInit(): void {}
}
