import { Component, Input } from '@angular/core';
import { EntryComponent } from 'src/app/shared-module/entry/entry.component';
import { TypeaheadService } from 'src/app/shared-module/typeahead.service';
import { ReferenceDateService } from 'src/app/shared-module/reference-date.service';
import { Week } from 'src/app/shared-module/week-days/week';
import { Tag } from 'src/app/shared-module/entry/entry.component';
import { SkillColor } from 'src/app/utils';

export type LeadershipEntry = {
  name: string;
  mainContact: boolean;
};

export type ProjectPriority = 0 | 1 | 2 | 3;

const cap = (val: number, min: number, max: number): number =>
  val < min ? min : val > max ? max : val;

export const matchSkillToProjectPriority = (
  color: SkillColor,
  adjustBy: 1 | 0 | -1 | -2 | -3 = 0
): ProjectPriority => {
  if (color === 'green') {
    return cap(1 + adjustBy, 0, 3) as ProjectPriority;
  }

  if (color === 'yellow') {
    return cap(2 + adjustBy, 0, 3) as ProjectPriority;
  }

  if (color === 'orange') {
    return cap(3 + adjustBy, 0, 3) as ProjectPriority;
  }

  return 0;
};

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

export function isProject(entry: any): entry is Project {
  return entry.client !== undefined;
}

export function isProjectEditable(entry: any): entry is ProjectEditable {
  return (
    entry.client !== undefined &&
    entry.type !== undefined &&
    entry.inEditMode !== undefined
  );
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
  constructor(
    typeaheadService: TypeaheadService,
    referenceDateService: ReferenceDateService
  ) {
    super(typeaheadService, referenceDateService);
  }

  getFieldClasses(fieldName: string): string {
    const baseClass = `section section-${fieldName} mr-12 flex flex-ver-ctr pl-3`;
    const sortedClass = fieldName === this.sortField ? ' sorted' : '';
    const otherClass = fieldName === 'pdm' ? ' flex-ctr-hor' : '';

    return `${baseClass}${sortedClass}${otherClass}`;
  }
}
