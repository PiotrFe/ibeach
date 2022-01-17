import { Component } from '@angular/core';
import { PersonEntry } from '../person';
import { TypeaheadService } from 'src/app/shared-module/typeahead.service';
import {
  AllocateService,
  AllocationEntry,
} from 'src/app/shared-module/allocate.service';
import { DragAndDropService } from 'src/app/shared-module/drag-and-drop.service';
import { Week } from 'src/app/shared-module/week-days/week';

@Component({
  selector: 'person-entry',
  templateUrl: './person-entry.component.html',
  styleUrls: ['./person-entry.component.scss'],
})
export class PersonEntryComponent extends PersonEntry {
  constructor(
    typeaheadService: TypeaheadService,
    private allocateService: AllocateService,
    private dragAndDrop: DragAndDropService
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

  handleDragStart(event: any) {
    this.dragAndDrop.onDragStart(event, this.id, 'match', 'people');
    return false;
  }

  getFieldClasses(fieldName: string): string {
    const baseClass = `section section-${fieldName} mr-12 flex flex-ver-ctr pl-3`;
    const sortedClass = fieldName === this.sortField ? ' sorted' : '';
    let otherClass = fieldName === 'pdm' ? ' flex-ctr-hor' : '';

    if (fieldName === 'name') {
      otherClass += ` draggable draggable-people`;
    }

    if (fieldName === 'skill') {
      otherClass += ` section-skill--${getSkillGroup(this.person.skill)}`;
    }

    // if (this.entryData.daysLeft > 0) {
    //   otherClass += ' droppable droppable-projects';
    // }

    return `${baseClass}${sortedClass}${otherClass}`;
  }
}

const getSkillGroup = (skill: string): string => {
  if (['EM', 'PSSM', 'PE', 'EDS'].includes(skill)) {
    return 'green';
  }
  if (['ASC', 'PSS', 'SRAS', 'SPDS'].includes(skill)) {
    return 'yellow';
  }
  if (['BA', 'FELL', 'SFDS', 'PSSR'].includes(skill)) {
    return 'orange';
  }
  if (['INT', 'SA'].includes(skill)) {
    return 'red';
  }
  return '';
};
