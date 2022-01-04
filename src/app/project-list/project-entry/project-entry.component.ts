import { Component, OnInit, Input } from '@angular/core';
import { TypeaheadService } from 'src/app/shared-module/typeahead.service';
import { EntryComponent } from 'src/app/shared-module/entry/entry.component';
import { Project, ProjectEditable } from '../project-list/project';
import { Week } from 'src/app/people-list/week';

@Component({
  selector: 'project-entry',
  templateUrl: './project-entry.component.html',
  styleUrls: ['./project-entry.component.scss'],
})
export class ProjectEntryComponent extends EntryComponent implements OnInit {
  project!: ProjectEditable;

  constructor(typeaheadService: TypeaheadService) {
    super(typeaheadService);
  }

  ngOnInit(): void {
    const entry = this.entryData as Project;
    this.project = {
      ...entry,
      inEditMode: false,
    };
  }

  getFieldClasses(fieldName: string): string {
    const baseClass = `section section-${fieldName} mr-12 flex flex-ver-ctr pl-3`;
    const sortedClass = fieldName === this.sortField ? ' sorted' : '';

    return `${baseClass}${sortedClass}`;
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
}
