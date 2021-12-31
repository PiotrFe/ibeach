import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { PersonEntry } from '../person';
import { TypeaheadService } from '../../shared-module/typeahead.service';
import { Week } from 'src/app/shared-module/week-days/week';

@Component({
  selector: 'person-entry',
  templateUrl: './person-entry.component.html',
  styleUrls: ['./person-entry.component.scss'],
})
export class PersonEntryComponent extends PersonEntry implements OnInit {
  @Input() displayedIn!: 'SUBMIT' | 'ALLOCATE';
  @Input() inEditMode!: boolean;
  @Input() editable: boolean = true;

  @Output() editEvent = new EventEmitter<string>();

  constructor(typeaheadService: TypeaheadService) {
    super(typeaheadService);
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

  ngOnInit(): void {}
}
