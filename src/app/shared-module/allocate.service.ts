import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { Person, PersonEditable } from 'src/app/people-list/person';
import {
  Project,
  ProjectEditable,
} from 'src/app/project-list/project-list/project';
import { Week, getDaysLeft } from 'src/app/shared-module/week-days/week';
import { FetchService } from 'src/app/shared-module/fetch.service';
import { DayHighlighterService } from 'src/app/shared-module/day-highlighter.service';

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
  reallocateTo?: {
    id: string;
    elemType: 'people' | 'projects';
    day: keyof Week;
  };
}

export interface AllocationDragDropEvent {
  id: string | null;
  elemType?: 'people' | 'projects';
  day?: keyof Week | 'match';
  area?: string;
}

interface RegisteredAllocationDragDropEvent extends AllocationDragDropEvent {
  draggable: PersonEditable | ProjectEditable;
  droppable?: PersonEditable | ProjectEditable;
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

  constructor(
    private fetchService: FetchService,
    private dayHighlighter: DayHighlighterService
  ) {}

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
    const draggable = (dataSet as Array<PersonEditable | ProjectEditable>).find(
      (elem: PersonEditable | Project) => elem.id === id
    );
    let droppable;

    if (!draggable) {
      return;
    }

    const allocationForDay = draggable?.week[day as keyof Week];

    if (
      typeof allocationForDay !== 'boolean' &&
      typeof allocationForDay !== 'undefined'
    ) {
      const subDataSet =
        elemType === 'people' ? this.projectDataSet : this.peopleDataSet;

      droppable = (subDataSet as Array<PersonEditable | ProjectEditable>).find(
        (elem: PersonEditable | ProjectEditable) =>
          elem.id === allocationForDay.id
      );
    }

    this.registeredDragEvent = {
      id,
      day,
      elemType,
      draggable,
      ...(droppable && {
        droppable,
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
    const { day: dayFrom, draggable } = this
      .registeredDragEvent as RegisteredAllocationDragDropEvent;

    const { day: dayCapitalized, id } = data;
    const dayTo = dayCapitalized?.toLowerCase();

    const droppable =
      data.elemType === 'projects'
        ? this.peopleDataSet.find(
            (elem: PersonEditable | ProjectEditable) => elem.id === id
          )
        : this.projectDataSet.find(
            (elem: PersonEditable | ProjectEditable) => elem.id === id
          );

    const personEntry = [draggable, droppable].find(
      (elem) => (elem as any)?.name
    );
    const projectEntry = [draggable, droppable].find(
      (elem) => (elem as any)?.client
    );

    // const allocationCriteriaMet = Boolean(
    //   personEntry &&
    //     projectEntry &&
    //     (dayTo === 'match' ||
    //       (personEntry.week[dayTo as keyof Week] === true &&
    //         projectEntry.week[dayTo as keyof Week] === true))
    // );

    const allocationCriteriaMet = Boolean(personEntry && projectEntry);

    // Regular allocation
    if (allocationCriteriaMet) {
      if (dayTo !== 'match') {
        const allocationLegal = this._checkIfAllocationLegal(
          draggable,
          dayTo as string
        );

        if (!allocationLegal) {
          return;
        }
      }
      this.registerAllocation(this.weekOf, {
        person: {
          id: personEntry!.id,
          value: (personEntry as PersonEditable)!.name,
        },
        project: {
          id: projectEntry!.id,
          value: (projectEntry as ProjectEditable)!.client,
        },
        day: dayTo as keyof Week | 'match',
      });
    }

    // Reallocation
    if (!allocationCriteriaMet && (draggable || droppable) && dayFrom) {
      const calendarEntry = draggable.week[dayFrom as keyof Week];

      if (typeof calendarEntry === 'boolean') {
        return;
      }

      const sameTypeDroppable =
        data.elemType === 'projects'
          ? this.projectDataSet.find(
              (elem: PersonEditable | ProjectEditable) => elem.id === id
            )
          : this.peopleDataSet.find(
              (elem: PersonEditable | ProjectEditable) => elem.id === id
            );

      if (!sameTypeDroppable) {
        return;
      }

      const person =
        data.elemType === 'projects'
          ? {
              id: calendarEntry.id,
              value: calendarEntry.text,
            }
          : {
              id: draggable.id,
              value: (draggable as PersonEditable).name,
            };

      const project =
        data.elemType === 'people'
          ? {
              id: calendarEntry.id,
              value: calendarEntry.text,
            }
          : {
              id: draggable.id,
              value: (draggable as ProjectEditable).client,
            };

      const allocationLegal = this._checkIfAllocationLegal(
        null,
        dayTo as string,
        person,
        project,
        data
      );

      if (!allocationLegal) {
        return;
      }

      this.registerAllocation(this.weekOf, {
        person,
        project,
        day: dayFrom as keyof Week,
        reallocateTo: {
          id: sameTypeDroppable.id,
          elemType: data.elemType as 'people' | 'projects',
          day: dayTo as keyof Week,
        },
      });
    }
  }

  private _checkIfAllocationLegal(
    draggable: any,
    dayTo: string,
    person?: any,
    project?: any,
    data?: any
  ): boolean {
    // check if a person / project's destination day is free for reallocation
    if (draggable && dayTo) {
      const isLegal =
        typeof draggable?.week[dayTo] === 'boolean' && draggable?.week[dayTo];
      if (!isLegal) {
        this._highlightIllegalAllocation(draggable.id, dayTo as keyof Week);
      }
      return isLegal;
    }

    if (!person || !project || !data) {
      return true;
    }
    const checkAvailabilityForID =
      data.elemType === 'projects' ? person.id : project.id;
    const checkAvailabilityInDataSet =
      data.elemType === 'projects' ? this.peopleDataSet : this.projectDataSet;
    const checkAvailabilityForEntry = (
      checkAvailabilityInDataSet as (PersonEditable | ProjectEditable)[]
    ).find((elem: any) => elem.id === checkAvailabilityForID);

    if (
      checkAvailabilityForEntry &&
      !checkAvailabilityForEntry.week[dayTo as keyof Week]
    ) {
      this._highlightIllegalAllocation(
        checkAvailabilityForID,
        dayTo as keyof Week
      );
      return false;
    }
    return true;
  }

  private _highlightIllegalAllocation(id: string, day: keyof Week): void {
    this.dayHighlighter.highlight(id, day);
  }

  private _handleTrash(): void {
    const { day, elemType, draggable, droppable } = this
      .registeredDragEvent as RegisteredAllocationDragDropEvent;

    const personEntry = elemType === 'people' ? draggable : droppable;
    const projectEntry = elemType === 'projects' ? draggable : droppable;

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
