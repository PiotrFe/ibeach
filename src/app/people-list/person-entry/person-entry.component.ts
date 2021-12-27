import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { PersonEntry } from '../person';
import { Week } from 'src/app/shared-module/week-days/week';

@Component({
  selector: 'person-entry',
  templateUrl: './person-entry.component.html',
  styleUrls: ['./person-entry.component.scss'],
})
export class PersonEntryComponent extends PersonEntry implements OnInit {
  @Input() inEditMode!: boolean;
  @Input() editable: boolean = true;

  @Output() editEvent = new EventEmitter<string>();

  constructor() {
    super();
  }

  handleEdit(): void {
    this.editEvent.emit(this.id);
  }

  handleDelete(): void {
    this.deleteEvent.emit(this.id);
  }

  onCalendarChange(calendarObj: Week) {
    this.calendarChangeEvent.emit({ calendarObj, id: this.id });
  }

  getFieldClasses(fieldName: string): string {
    const baseClass = `section section-${fieldName} tbl-row mr-12 flex flex-ver-ctr pl-3`;
    const sortedClass = fieldName === this.sortField ? ' sorted' : '';
    const otherClass = fieldName === 'pdm' ? ' flex-ctr-hor' : '';

    return `${baseClass}${sortedClass}${otherClass}`;
  }

  ngOnInit(): void {}
}
