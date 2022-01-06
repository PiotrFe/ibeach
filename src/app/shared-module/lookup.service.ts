import { Injectable } from '@angular/core';
import { PersonEditable } from 'src/app/people-list/person';
import { ProjectEditable } from 'src/app/project-list/project-list/project';
import { WeekAllocated } from 'src/app/shared-module/week-days/week';

export interface DropdownEntry {
  id: string;
  name: string;
}

@Injectable({
  providedIn: 'root',
})
export class LookupService {
  peopleDataSet!: PersonEditable[];
  projectDataSet!: ProjectEditable[];

  constructor() {}

  registerDatasetChange(newDataset: {
    dataType: 'people' | 'projects';
    data: PersonEditable[] | ProjectEditable[];
  }): void {
    const { dataType, data } = newDataset;

    if (dataType === 'people') {
      this.peopleDataSet = data as PersonEditable[];
    }

    if (dataType === 'projects') {
      this.projectDataSet = data as ProjectEditable[];
    }
  }

  getDataForDay(
    dataType: 'people' | 'projects',
    day: keyof WeekAllocated
  ): DropdownEntry[] {
    if (dataType === 'people') {
      return this.getPeopleForDay(day);
    }

    return this.getProjectsForDay(day);
  }

  getPeopleForDay(day: keyof WeekAllocated): DropdownEntry[] {
    if (!this.peopleDataSet.length) {
      return [];
    }

    return this.peopleDataSet
      .filter((person) => person.week[day])
      .map((person) => ({
        id: person.id,
        name: person.name,
      }));
  }

  getProjectsForDay(day: keyof WeekAllocated): DropdownEntry[] {
    if (!this.projectDataSet.length) {
      return [];
    }

    return this.projectDataSet
      .filter((project) => project.week[day])
      .map((project) => ({
        id: project.id,
        name: project.client,
      }));
  }

  // getProjectsForDay(day: keyof WeekAllocated): DropdownEntry[] {}
}
