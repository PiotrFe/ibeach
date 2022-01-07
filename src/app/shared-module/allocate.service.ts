import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { Person, PersonEditable } from 'src/app/people-list/person';
import {
  Project,
  ProjectEditable,
} from 'src/app/project-list/project-list/project';
import { Week } from 'src/app/shared-module/week-days/week';
import { FetchService } from 'src/app/shared-module/fetch.service';

export interface DropdownEntry {
  id: string;
  value: string;
}

export interface AllocationEntry {
  person: {
    id: string;
    value: string;
  };
  project: {
    id: string;
    value: string;
  };
  day: string;
}

export interface Dataset {
  dataType: 'people' | 'projects';
  data: PersonEditable[] | ProjectEditable[];
}

@Injectable({
  providedIn: 'root',
})
export class AllocateService {
  peopleDataSet!: PersonEditable[];
  projectDataSet!: ProjectEditable[];
  subject: Subject<Dataset> = new Subject<Dataset>();
  onDataset = this.subject.asObservable();

  constructor(private fetchService: FetchService) {}

  registerDataset(newDataset: Dataset): void {
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
    day: keyof Week
  ): DropdownEntry[] {
    if (dataType === 'people') {
      return this.getPeopleForDay(day);
    }

    return this.getProjectsForDay(day);
  }

  getPeopleForDay(day: keyof Week): DropdownEntry[] {
    if (!this.peopleDataSet.length) {
      return [];
    }

    return this.peopleDataSet
      .filter((person) => person.week[day])
      .map((person) => ({
        id: person.id,
        value: person.name,
      }));
  }

  getProjectsForDay(day: keyof Week): DropdownEntry[] {
    if (!this.projectDataSet.length) {
      return [];
    }

    return this.projectDataSet
      .filter((project) => project.week[day])
      .map((project) => ({
        id: project.id,
        value: project.client,
      }));
  }

  registerAllocation(weekOf: Date, entry: AllocationEntry): void {
    this.fetchService.saveAllocationEntry(weekOf, entry).subscribe({
      next: ({ peopleData, projectData }) => {
        this.peopleDataSet = peopleData.map((entry: Person) => ({
          ...entry,
          inEditMode: false,
        }));
        this.projectDataSet = projectData.map((entry: Project) => ({
          ...entry,
          inEditMode: false,
        }));
        console.log({ peopleData, projectData });
      },

      error: (e) => {
        console.log(e);
      },
    });
  }
}
