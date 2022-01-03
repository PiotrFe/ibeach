import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  AfterViewInit,
} from '@angular/core';
import { PersonEditable, PersonEntry, Person } from '../person';
import { TypeaheadService } from '../../shared-module/typeahead.service';
import { ResizeObserverService } from 'src/app/shared-module/resize-observer.service';
import { Week } from 'src/app/shared-module/week-days/week';

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
