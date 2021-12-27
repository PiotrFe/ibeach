import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Person, PersonEntry } from '../person';
import { Week } from 'src/app/shared-module/week-days/week';
import { PAGE_SECTIONS } from '../../app.component';

@Component({
  selector: 'person-entry',
  templateUrl: './person-entry.component.html',
  styleUrls: ['./person-entry.component.scss'],
})
export class PersonEntryComponent extends PersonEntry implements OnInit {
  @Input() inEditMode!: boolean;
  @Input() editable: boolean = true;

  @Output() editEvent = new EventEmitter<string>();

  @Output() tagChangeEvent = new EventEmitter<{
    id: string;
    value: string;
    action: 'add' | 'remove';
  }>();

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

  onTagSubmit(): void {
    this.tagChangeEvent.emit({
      id: this.id,
      value: this.tagInput.value,
      action: 'add',
    });
    this.tagInput.setValue('');
    this.showAddTag = false;
  }

  onTagDelete(value: string): void {
    this.tagChangeEvent.emit({
      id: this.id,
      value,
      action: 'remove',
    });
  }

  ngOnInit(): void {}
}
