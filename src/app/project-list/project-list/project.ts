import { Component, Input } from '@angular/core';
import { EntryComponent } from 'src/app/shared-module/entry/entry.component';
import { TypeaheadService } from 'src/app/shared-module/typeahead.service';
import { Week } from 'src/app/shared-module/week-days/week';
import { Tag } from 'src/app/shared-module/entry/entry.component';

export type LeadershipEntry = {
  name: string;
  mainContact: boolean;
};

export type ProjectPriority = 0 | 1 | 2 | 3;

export interface Project {
  id: string;
  client: string;
  type: string;
  availDate?: Date;
  week: Week;
  daysLeft: number;
  leadership: LeadershipEntry[];
  comments?: string;
  tags: Tag[];
  emailSent?: boolean;
  priority?: ProjectPriority;
}

export interface ProjectEditable extends Project {
  inEditMode: boolean;
}

export type ProjectEvent = {
  id: string;
  client: string;
  type: string;
  comments: string;
  availDate: Date;
  week: Week;
  tags: Tag[];
  leadership: string[];
  doDuplicate?: boolean;
  priority?: ProjectPriority;
};

@Component({
  template: '',
})
export class ProjectEntry extends EntryComponent {
  constructor(typeaheadService: TypeaheadService) {
    super(typeaheadService);
  }

  getFieldClasses(fieldName: string): string {
    const baseClass = `section section-${fieldName} mr-12 flex flex-ver-ctr pl-3`;
    const sortedClass = fieldName === this.sortField ? ' sorted' : '';
    const otherClass = fieldName === 'pdm' ? ' flex-ctr-hor' : '';

    return `${baseClass}${sortedClass}${otherClass}`;
  }
}
