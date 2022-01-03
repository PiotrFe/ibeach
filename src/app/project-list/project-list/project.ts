import { Component, Input } from '@angular/core';
import { EntryComponent } from 'src/app/shared-module/entry/entry.component';
import { TypeaheadService } from 'src/app/shared-module/typeahead.service';
import { Week } from 'src/app/people-list/week';
import { Tag } from 'src/app/shared-module/entry/entry.component';

export interface Project {
  id: string;
  client: string;
  type: 'LOP' | 'workshop' | 'warroom' | 'other';
  leadership: string[];
  availDate?: Date;
  week: Week;
  daysLeft: number;
  comments?: string;
  tags: Tag[];
}

export interface ProjectEditable extends Project {
  inEditMode: boolean;
}

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
