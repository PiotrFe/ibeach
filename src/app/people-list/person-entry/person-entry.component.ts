import { Component } from '@angular/core';
import { PersonEntry } from '../person';
import { TypeaheadService } from '../../shared-module/typeahead.service';
import { Week } from 'src/app/shared-module/week-days/week';
import { trigger, style, animate, transition } from '@angular/animations';

@Component({
  selector: 'person-entry',
  templateUrl: './person-entry.component.html',
  styleUrls: ['./person-entry.component.scss'],
})
export class PersonEntryComponent extends PersonEntry {
  constructor(typeaheadService: TypeaheadService) {
    super(typeaheadService);
  }

  ngOnChanges() {}

  handleEdit(): void {
    this.editEvent.emit(this.id);
  }

  handleDelete(): void {
    this.deleteEvent.emit(this.id);
  }

  onCalendarChange(calendarObj: Week) {
    this.calendarChangeEvent.emit({ calendarObj, id: this.id });
  }
}
