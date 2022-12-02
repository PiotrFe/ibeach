import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Week } from 'src/app/shared-module/week-days/week';
import { EntryComponent } from 'src/app/shared-module/entry/entry.component';
import { TypeaheadService } from 'src/app/shared-module/typeahead.service';
import { ReferenceDateService } from 'src/app/shared-module/reference-date.service';
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

export function isPerson(entry: any): entry is Person {
  return entry.name !== undefined && entry.skill !== undefined;
}

export function isPersonEditable(entry: any): entry is PersonEditable {
  return (
    entry.name !== undefined &&
    entry.skill !== undefined &&
    entry.inEditMode !== undefined
  );
}

@Component({
  template: '',
})
export class PersonEntry extends EntryComponent implements OnInit, OnDestroy {
  @Input() displayedIn!: 'SUBMIT' | 'ALLOCATE';

  person!: PersonEditable;

  constructor(
    typeaheadService: TypeaheadService,
    referenceDateService: ReferenceDateService
  ) {
    super(typeaheadService, referenceDateService);
  }

  ngOnInit(): void {
    this.subscribeToServices();
    const entry = this.entryData as Person;
    this.person = {
      ...entry,
      inEditMode: false,
    };
  }

  ngOnDestroy(): void {
    this.unsubscribeFromServices();
  }

  getPDMTypeAhead(key: string): any[] {
    return [];
  }
}
