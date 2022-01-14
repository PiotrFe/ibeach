import { Component, OnInit, Input, ViewChild, ElementRef } from '@angular/core';
import { TypeaheadService } from 'src/app/shared-module/typeahead.service';
import { DragAndDropService } from 'src/app/shared-module/drag-and-drop.service';
import { EntryComponent } from 'src/app/shared-module/entry/entry.component';
import { Project, ProjectEditable } from '../project-list/project';
import { Week } from 'src/app/shared-module/week-days/week';
import { generateEmail } from 'src/app/shared-module/email';
import {
  AllocateService,
  AllocationEntry,
} from 'src/app/shared-module/allocate.service';

@Component({
  selector: 'project-entry',
  templateUrl: './project-entry.component.html',
  styleUrls: ['./project-entry.component.scss'],
})
export class ProjectEntryComponent extends EntryComponent implements OnInit {
  project!: ProjectEditable;

  @ViewChild('entryContainer') entryContainer!: ElementRef;

  constructor(
    private allocateService: AllocateService,
    private dragAndDrop: DragAndDropService,
    typeaheadService: TypeaheadService
  ) {
    super(typeaheadService);
  }

  ngOnInit(): void {
    const entry = this.entryData as Project;
    this.project = {
      ...entry,
      inEditMode: false,
    };
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

  onAllocation(event: any): void {
    const { id, value, day } = event;
    const allocationEntry: AllocationEntry = {
      person: {
        id,
        value,
      },
      project: {
        id: this.project.id,
        value: this.project.client,
      },
      day,
    };

    this.allocateService.registerAllocation(
      this.referenceDate,
      allocationEntry
    );
  }
  handleDragStart(event: any) {
    this.dragAndDrop.onDragStart(event, this.id, 'match', 'projects');
    return false;
  }

  getFieldClasses(fieldName: string): string {
    const baseClass = `section section-${fieldName} mr-12 flex flex-ver-ctr pl-3`;
    const sortedClass = fieldName === this.sortField ? ' sorted' : '';
    let otherClass = '';

    if (fieldName === 'name') {
      otherClass += ` draggable draggable-projects`;
    }

    if (fieldName === 'comments') {
      otherClass += ` section-comments--project`;
    }

    if (fieldName === 'leadership') {
      otherClass += ` fs-07`;
    }

    // if (this.entryData.daysLeft > 0) {
    //   otherClass += ' droppable droppable-people';
    // }

    return `${baseClass}${sortedClass}${otherClass}`;
  }

  canSendEmail(): boolean {
    return Boolean(
      Object.values(this.entryData.week).find((val) => typeof val !== 'boolean')
    );
  }

  handleGenerateEmail() {
    generateEmail(this.entryData as ProjectEditable, this.entryContainer);
  }
}
