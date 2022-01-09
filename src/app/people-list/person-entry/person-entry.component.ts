import { Component } from '@angular/core';
import { PersonEntry } from '../person';
import { TypeaheadService } from 'src/app/shared-module/typeahead.service';
import {
  AllocateService,
  AllocationEntry,
} from 'src/app/shared-module/allocate.service';
import { Week } from 'src/app/shared-module/week-days/week';

@Component({
  selector: 'person-entry',
  templateUrl: './person-entry.component.html',
  styleUrls: ['./person-entry.component.scss'],
})
export class PersonEntryComponent extends PersonEntry {
  constructor(
    typeaheadService: TypeaheadService,
    private allocateService: AllocateService
  ) {
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

  onAllocation(event: any): void {
    const { id, value, day } = event;
    const allocationEntry: AllocationEntry = {
      project: {
        id,
        value,
      },
      person: {
        id: this.person.id,
        value: this.person.name,
      },
      day,
    };

    this.allocateService.registerAllocation(
      this.referenceDate,
      allocationEntry
    );
  }
}
