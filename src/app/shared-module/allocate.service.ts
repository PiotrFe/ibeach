import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { Person, PersonEditable } from 'src/app/people-list/person';
import {
  Project,
  ProjectEditable,
} from 'src/app/project-list/project-list/project';
import { Week, getDaysLeft } from 'src/app/shared-module/week-days/week';
import { FetchService } from 'src/app/shared-module/fetch.service';

export interface Dataset {
  dataType: 'people' | 'projects';
  data: PersonEditable[] | ProjectEditable[];
  weekOf: Date;
}

export interface DropdownEntry {
  id: string;
  value: string;
}

export interface AllocationEntry {
  person?: {
    id: string;
    value: string | null;
  };
  project?: {
    id: string;
    value: string | null;
  };
  day: keyof Week | 'match';
}

export interface AllocationDragDropEvent {
  id: string | null;
  elemType?: 'people' | 'projects';
  day?: keyof Week | 'match';
  area?: string;
}

interface RegisteredAllocationDragDropEvent extends AllocationDragDropEvent {
  entryMain: PersonEditable | ProjectEditable;
  entrySub?: PersonEditable | ProjectEditable;
}

@Injectable({
  providedIn: 'root',
})
export class AllocateService {
  peopleDataSet!: PersonEditable[];
  projectDataSet!: ProjectEditable[];
  registeredDragEvent!: RegisteredAllocationDragDropEvent | null;
  subject: Subject<Dataset> = new Subject<Dataset>();
  onDataset = this.subject.asObservable();
  weekOf!: Date;

  constructor(private fetchService: FetchService) {}

  registerDataset(newDataset: Dataset): void {
    const { dataType, data, weekOf } = newDataset;

    if (dataType === 'people') {
      this.peopleDataSet = data as PersonEditable[];
    }

    if (dataType === 'projects') {
      this.projectDataSet = data as ProjectEditable[];
    }

    this.weekOf = weekOf;
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
      .filter(
        (person) => typeof person.week[day] === 'boolean' && person.week[day]
      )
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
      .filter(
        (project) => typeof project.week[day] === 'boolean' && project.week[day]
      )
      .map((project) => ({
        id: project.id,
        value: project.client,
      }));
  }

  registerAllocation(weekOf: Date, entry: AllocationEntry): void {
    if (weekOf !== this.weekOf) {
      throw new Error('Date mismatch');
    }
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

        this.subject.next({
          dataType: 'people',
          data: this.peopleDataSet,
          weekOf: this.weekOf,
        });
        this.subject.next({
          dataType: 'projects',
          data: this.projectDataSet,
          weekOf: this.weekOf,
        });
      },

      error: (e) => {
        console.log(e);
      },
    });
  }

  registerDragEvent(data: AllocationDragDropEvent): void {
    const { id, day, elemType } = data;
    const dataSet =
      elemType === 'people' ? this.peopleDataSet : this.projectDataSet;
    const entryMain = (dataSet as Array<PersonEditable | ProjectEditable>).find(
      (elem: PersonEditable | Project) => elem.id === id
    );
    let entrySub;

    if (!entryMain) {
      return;
    }

    const allocationForDay = entryMain?.week[day as keyof Week];

    if (
      typeof allocationForDay !== 'boolean' &&
      typeof allocationForDay !== 'undefined'
    ) {
      const subDataSet =
        elemType === 'people' ? this.projectDataSet : this.peopleDataSet;

      entrySub = (subDataSet as Array<PersonEditable | ProjectEditable>).find(
        (elem: PersonEditable | ProjectEditable) =>
          elem.id === allocationForDay.id
      );
    }

    this.registeredDragEvent = {
      id,
      day,
      elemType,
      entryMain,
      ...(entrySub && {
        entrySub,
      }),
    };
  }

  registerDropEvent(data: AllocationDragDropEvent): void {
    const { id: droppableId } = data;

    if (droppableId === null) {
      this.registeredDragEvent = null;
      return;
    }

    if (droppableId === 'trash-main') {
      this._handleTrash();
    } else {
      this._handleAllocate(data);
    }
  }

  private _handleAllocate(data: AllocationDragDropEvent): void {
    const { elemType, entryMain } = this
      .registeredDragEvent as RegisteredAllocationDragDropEvent;

    const { day: dayCapitalized, id } = data;
    const day = dayCapitalized?.toLowerCase();

    const entrySub =
      elemType === 'people'
        ? this.projectDataSet.find(
            (elem: PersonEditable | ProjectEditable) => elem.id === id
          )
        : this.peopleDataSet.find(
            (elem: PersonEditable | ProjectEditable) => elem.id === id
          );

    const personEntry = (
      elemType === 'people' ? entryMain : entrySub
    ) as PersonEditable;
    const projectEntry = (
      elemType === 'projects' ? entryMain : entrySub
    ) as ProjectEditable;

    const allocationCriteriaMet =
      personEntry &&
      projectEntry &&
      (day === 'match' ||
        (personEntry.week[day as keyof Week] === true &&
          projectEntry.week[day as keyof Week] === true));

    console.log({ personEntry, projectEntry, day });

    if (allocationCriteriaMet) {
      this.registerAllocation(this.weekOf, {
        person: {
          id: personEntry.id,
          value: personEntry.name,
        },
        project: {
          id: projectEntry.id,
          value: projectEntry.client,
        },
        day: day as keyof Week | 'match',
      });
    }
  }

  private _handleTrash(): void {
    const { day, elemType, entryMain, entrySub } = this
      .registeredDragEvent as RegisteredAllocationDragDropEvent;

    const personEntry = elemType === 'people' ? entryMain : entrySub;
    const projectEntry = elemType === 'projects' ? entryMain : entrySub;

    if (personEntry && projectEntry) {
      this.registerAllocation(this.weekOf, {
        person: {
          id: personEntry.id,
          value: null,
        },
        project: {
          id: projectEntry.id,
          value: null,
        },
        day: day as keyof Week | 'match',
      });
    } else if (personEntry || projectEntry) {
      this.registerAllocation(this.weekOf, {
        ...(personEntry && {
          person: { id: personEntry.id, value: null },
        }),
        ...(projectEntry && {
          project: {
            id: projectEntry.id,
            value: null,
          },
        }),
        day: 'match',
      });
    }
  }
}
