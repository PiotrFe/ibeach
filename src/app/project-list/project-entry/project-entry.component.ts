import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Subscription } from 'rxjs';
import {
  AllocateService,
  AllocationEntry,
} from 'src/app/shared-module/allocate.service';
import {
  ConfigService,
  EmailTemplate,
} from 'src/app/shared-module/config.service';
import { DataStoreService } from 'src/app/shared-module/data-store.service';
import { DragAndDropService } from 'src/app/shared-module/drag-and-drop.service';
import { EntryComponent } from 'src/app/shared-module/entry/entry.component';
import { generateEmail } from 'src/app/shared-module/email';
import { Project, ProjectEditable } from '../project-list/project';
import { TypeaheadService } from 'src/app/shared-module/typeahead.service';
import { Week } from 'src/app/shared-module/week-days/week';

@Component({
  selector: 'project-entry',
  templateUrl: './project-entry.component.html',
  styleUrls: ['./project-entry.component.scss'],
})
export class ProjectEntryComponent extends EntryComponent implements OnInit {
  project!: ProjectEditable;
  subscription: Subscription = new Subscription();
  emailTemplate!: EmailTemplate;

  @ViewChild('entryContainer') entryContainer!: ElementRef;

  constructor(
    private allocateService: AllocateService,
    private dataStoreService: DataStoreService,
    private dragAndDrop: DragAndDropService,
    typeaheadService: TypeaheadService,
    private config: ConfigService
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
    const { id, value, skill, day } = event;
    const allocationEntry: AllocationEntry = {
      person: {
        id,
        value,
        skill,
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

    if (!this.inEditMode && fieldName === 'name') {
      otherClass += ` draggable draggable-projects`;
    }

    if (fieldName === 'comments') {
      otherClass += ` section-comments--project`;
    }

    if (fieldName === 'leadership') {
      otherClass += ` fs-07`;
    }

    if (fieldName === 'comments' && this.entryContainerWidth < 4) {
      otherClass += ` section-comments--left`;
    }

    return `${baseClass}${sortedClass}${otherClass}`;
  }

  handleGenerateEmail() {
    this.dataStoreService.monitorNavigation = false;
    generateEmail(
      this.entryData as ProjectEditable,
      this.entryContainer,
      this.dataStoreService.getContactList(),
      this.config.getEmailTemplate()
    );
  }
}
