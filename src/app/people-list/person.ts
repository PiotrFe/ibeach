import { Component, Input } from '@angular/core';
import { Week } from 'src/app/shared-module/week-days/week';
import { EntryComponent } from 'src/app/shared-module/entry/entry.component';
import { TypeaheadService } from 'src/app/shared-module/typeahead.service';
import { Tag } from 'src/app/shared-module/entry/entry.component';

export const SKILLS = ['EM', 'ASC', 'FELL', 'BA', 'INT'];

export interface Person {
  id: string;
  name: string;
  skill: string;
  pdm?: string;
  availDate?: Date;
  week: Week;
  daysLeft: number;
  comments?: string;
  tags: Tag[];
}

export interface PersonEditable extends Person {
  inEditMode: boolean;
}

@Component({
  template: '',
})
export class PersonEntry extends EntryComponent {
  @Input() displayedIn!: 'SUBMIT' | 'ALLOCATE';
  // @Input() entryContainerWidth!: number;

  person!: PersonEditable;

  constructor(typeaheadService: TypeaheadService) {
    super(typeaheadService);
  }

  ngOnInit(): void {
    const entry = this.entryData as Person;
    this.person = {
      ...entry,
      inEditMode: false,
    };
  }

  getPDMTypeAhead(key: string): any[] {
    return [];
  }

  getFieldClasses(fieldName: string): string {
    const baseClass = `section section-${fieldName} mr-12 flex flex-ver-ctr pl-3`;
    const sortedClass = fieldName === this.sortField ? ' sorted' : '';
    const otherClass = fieldName === 'pdm' ? ' flex-ctr-hor' : '';

    return `${baseClass}${sortedClass}${otherClass}`;
  }
}
