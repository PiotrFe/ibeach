import { Injectable } from '@angular/core';
import { Subject, ReplaySubject } from 'rxjs';
import { Person, PersonEditable } from 'src/app/people-list/person';
import {
  Project,
  ProjectEditable,
  matchSkillToProjectPriority,
} from 'src/app/project-list/project-list/project';
import { Week, getDaysLeft } from 'src/app/shared-module/week-days/week';
import { DataStoreService } from 'src/app/shared-module/data-store.service';
import { ReferenceDateService } from 'src/app/shared-module/reference-date.service';
import { DayHighlighterService } from 'src/app/shared-module/day-highlighter.service';
import { FetchService } from 'src/app/shared-module/fetch.service';
import { IsOnlineService } from 'src/app/shared-module/is-online.service';
import { cleanString, getSkillGroupColor, SkillColor } from 'src/app/utils';
import { WeeklyPeopleList, WeeklyProjectList } from '../utils/StorageManager';

export interface Dataset {
  dataType: 'people' | 'projects';
  data: PersonEditable[] | ProjectEditable[];
  weekOf: Date;
}

export interface DropdownEntry {
  id: string;
  value: string;
  skill?: string;
}

export interface AllocationEntry {
  person?: {
    id: string;
    value: string | null;
    skill: string | undefined;
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

export interface DeletionEvent {
  deletedID: string;
  deletedRecordType: 'people' | 'projects';
  affectedSubIDs: string[];
}

export interface SaveEvent {
  save: boolean;
  issuedBy: 'people' | 'projects';
}

export function isInstanceOfSaveEvent(object: any): object is SaveEvent {
  return typeof object.save === 'boolean';
}

export function isInstanceOfDeleteEvent(object: any): object is DeletionEvent {
  return (
    'deletedID' in object &&
    'deletedRecordType' in object &&
    'affectedSubIDs' in object
  );
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

type ProfileConfig = {
  skill: boolean | 1 | -1 | -2 | -3;
  days: boolean | -1 | -2 | -3 | -4;
  tagThreshold: 90 | 70 | 50 | 20 | 0;
  comments?: boolean;
};

@Injectable({
  providedIn: 'root',
})
export class AllocateService {
  datasetSubject: Subject<Dataset> = new Subject<Dataset>();
  deleteRecordSubject: Subject<DeletionEvent | SaveEvent> = new Subject<
    DeletionEvent | SaveEvent
  >();
  workInProgressSubject$: ReplaySubject<boolean> = new ReplaySubject<boolean>();
  hasEntriesToAutoAllocate: boolean = false;
  hasEntriesToClear: boolean = false;
  peopleDataSet!: PersonEditable[];
  projectDataSet!: ProjectEditable[];
  registeredDragEvent!: RegisteredAllocationDragDropEvent | null;
  onDataset = this.datasetSubject.asObservable();
  onDeleteRecord = this.deleteRecordSubject.asObservable();
  onWorkInProgress$ = this.workInProgressSubject$.asObservable();
  weekOf!: Date;

  constructor(
    private dataStoreService: DataStoreService,
    private dayHighlighter: DayHighlighterService,
    private fetchService: FetchService,
    private isOnlineService: IsOnlineService,
    private referenceDateService: ReferenceDateService
  ) {
    referenceDateService.onReferenceDateChange$.subscribe({
      next: ({ referenceDate, excludePast }) => {
        if (referenceDate || typeof excludePast === 'boolean') {
          this.hasEntriesToAutoAllocate = this.#canAutoAllocateEntries();
          this.hasEntriesToClear = this.#canClearEntries();
        }
      },
    });
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
        (person) =>
          typeof person.week[day] === 'boolean' &&
          person.week[day] &&
          !this.referenceDateService.isPastDay(day)
      )
      .map((person) => ({
        id: person.id,
        value: person.name,
        skill: person.skill,
      }));
  }

  getProjectsForDay(day: keyof Week): DropdownEntry[] {
    if (!this.projectDataSet.length) {
      return [];
    }

    return this.projectDataSet
      .filter(
        (project) =>
          typeof project.week[day] === 'boolean' &&
          project.week[day] &&
          !this.referenceDateService.isPastDay(day)
      )
      .map((project) => ({
        id: project.id,
        value: project.client,
      }));
  }

  handleDeleteRecord(
    entry: PersonEditable | ProjectEditable,
    entryType: 'people' | 'projects'
  ): void {
    const deletedID = entry.id;
    const deletedRecordType = entryType;
    const affectedSubIDs = Array.from(
      new Set(
        Object.values(entry.week)
          .filter((val) => typeof val !== 'boolean')
          .map((val) => (val as any).id)
      )
    );

    this.deleteRecordSubject.next({
      deletedID,
      deletedRecordType,
      affectedSubIDs,
    });
  }

  registerDataset(newDataset: Dataset): void {
    const { dataType, data, weekOf } = newDataset;

    if (dataType === 'people') {
      this.peopleDataSet = data as PersonEditable[];
    }

    if (dataType === 'projects') {
      this.projectDataSet = data as ProjectEditable[];
    }

    this.hasEntriesToAutoAllocate = this.#canAutoAllocateEntries();
    this.hasEntriesToClear = this.#canClearEntries();
    this.weekOf = weekOf;
  }

  registerAllocation(weekOf: Date, entry: AllocationEntry) {
    if (this.isOnlineService.isOnline) {
      this.registerOnlineAllocation(weekOf, entry);
    } else {
      this.registerOfflineAllocation(weekOf, entry);
    }
  }

  registerOnlineAllocation(weekOf: Date, entry: AllocationEntry): void {
    if (weekOf !== this.weekOf) {
      throw new Error('Date mismatch');
    }

    // If in online mode, use fetch service to send entry to server and allow it to handle allocation
    // then emit updated data to components
    this.fetchService.saveAllocationEntry(weekOf, entry).subscribe({
      next: ({ peopleData, projectData }) => {
        this.#updateDataset(peopleData, projectData);
        this.#emitData();
      },

      error: (e) => {
        console.log(e);
      },
    });
  }

  registerOfflineAllocation(weekOf: Date, entry: AllocationEntry) {
    const { data: peopleData } = this.dataStoreService.getPeopleList(weekOf);
    const { data: projectData } = this.dataStoreService.getProjectList(weekOf);

    // if in offine mode, update local store withouth emitting to components (store will emit)
    if (entry.day !== 'match') {
      this.#allocateSingleDay({
        peopleData,
        projectData,
        newEntry: entry,
      });
    } else {
      this.#allocateFullWeek({
        peopleData,
        projectData,
        newEntry: entry,
      });
    }

    this.#updateDataset(peopleData, projectData);
    this.#emitData();
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

  registerSaveEvent(save: boolean, entryType: 'people' | 'projects') {
    this.deleteRecordSubject.next({ save, issuedBy: entryType });
  }

  // ******************************************
  // UPDATE DATASET AND EMIT FUNCTIONS
  // ******************************************

  #emitData() {
    this.datasetSubject.next({
      dataType: 'people',
      data: this.peopleDataSet,
      weekOf: this.weekOf,
    });
    this.datasetSubject.next({
      dataType: 'projects',
      data: this.projectDataSet,
      weekOf: this.weekOf,
    });
  }

  #updateDataset(people: Person[], projects: Project[]) {
    this.peopleDataSet = people.map((entry: Person) => ({
      ...entry,
      inEditMode: false,
    }));
    this.projectDataSet = projects.map((entry: Project) => ({
      ...entry,
      inEditMode: false,
    }));

    this.hasEntriesToAutoAllocate = this.#canAutoAllocateEntries();
    this.hasEntriesToClear = this.#canClearEntries();
  }

  // ******************************************
  // ALLOCATION FUNCTIONS
  // ******************************************

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

    const allocationCriteriaMet = Boolean(personEntry && projectEntry);

    // Regular allocation
    if (allocationCriteriaMet) {
      const allocationLegal = this._checkIfAllocationLegal(
        draggable,
        dayFrom as string,
        dayTo as string
      );

      if (!allocationLegal) {
        return;
      }

      this.registerAllocation(this.weekOf, {
        person: {
          id: personEntry!.id,
          skill: (personEntry as PersonEditable)!.skill,
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

      if (
        typeof calendarEntry === 'boolean' ||
        (dayFrom !== 'match' && this.referenceDateService.isPastDay(dayFrom))
      ) {
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
              skill: calendarEntry.skill,
            }
          : {
              id: draggable.id,
              value: (draggable as PersonEditable).name,
              skill: (draggable as PersonEditable).skill,
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
        dayFrom as string,
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
    dayFrom: string,
    dayTo: string,
    person?: any,
    project?: any,
    data?: any
  ): boolean {
    // check if a person / project's destination day is free for reallocation

    if (draggable && dayTo === 'match') {
      const { daysLeft } = draggable;

      if (daysLeft === 0) {
        this._highlightIllegalAllocation(draggable.id, dayTo);
        return false;
      }
    }

    if (draggable && dayTo !== 'match') {
      const isLegal =
        typeof draggable?.week[dayTo] === 'boolean' &&
        draggable?.week[dayTo] &&
        !this.referenceDateService.isPastDay(dayTo as keyof Week);
      if (!isLegal) {
        this._highlightIllegalAllocation(draggable.id, dayTo as keyof Week);
      }
      return isLegal;
    }

    if (dayFrom === dayTo) {
      return true;
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

    const isLegal =
      checkAvailabilityForEntry &&
      typeof checkAvailabilityForEntry.week[dayTo as keyof Week] ===
        'boolean' &&
      checkAvailabilityForEntry.week[dayTo as keyof Week];

    if (checkAvailabilityForEntry && !isLegal) {
      this._highlightIllegalAllocation(
        checkAvailabilityForID,
        dayTo as keyof Week
      );
      return false;
    }
    return true;
  }

  private _highlightIllegalAllocation(
    id: string,
    day: keyof Week | 'match'
  ): void {
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
          skill: (personEntry as PersonEditable).skill,
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
          person: {
            id: personEntry.id,
            skill: (personEntry as PersonEditable).skill,
            value: null,
          },
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

  #allocateSingleDay = ({
    peopleData,
    projectData,
    newEntry,
  }: {
    peopleData: Person[];
    projectData: Project[];
    newEntry: AllocationEntry;
  }) => {
    const { person, project, day, reallocateTo } = newEntry;

    if (reallocateTo?.elemType === 'projects') {
      this.#reallocatePerson({ peopleData, projectData, newEntry });
      return;
    }

    if (reallocateTo?.elemType === 'people') {
      this.#reallocateProject({ peopleData, projectData, newEntry });
      return;
    }

    const personIdx = peopleData.findIndex((entry) => entry.id === person?.id);
    const projectIdx = projectData.findIndex(
      (entry) => entry.id === project?.id
    );

    const personWeek = {
      ...peopleData[personIdx].week,
      [day]: !project?.value
        ? true
        : {
            id: project.id,
            text: project.value,
          },
    };

    const projectWeek = {
      ...projectData[projectIdx].week,
      [day]: !person?.value
        ? true
        : {
            id: person.id,
            text: person.value,
            skill: person.skill,
          },
    };

    peopleData[personIdx] = {
      ...peopleData[personIdx],
      week: personWeek,
      daysLeft: getDaysLeft(personWeek),
    };
    projectData[projectIdx] = {
      ...projectData[projectIdx],
      week: projectWeek,
      daysLeft: getDaysLeft(projectWeek),
      emailSent: false,
    };
  };

  #allocateFullWeek = ({
    peopleData,
    projectData,
    newEntry,
  }: {
    peopleData: Person[];
    projectData: Project[];
    newEntry: AllocationEntry;
  }) => {
    const { person, project } = newEntry;

    if (!person && !project) {
      throw new Error('No data supplied');
    }

    if (!person || !project) {
      this.#clearWeek({ peopleData, projectData, entry: newEntry });
      return;
    }

    const personIdx = peopleData.findIndex((entry) => entry.id === person.id);
    const projectIdx = projectData.findIndex(
      (entry) => entry.id === project.id
    );

    const personEntry = peopleData[personIdx];
    const projectEntry = projectData[projectIdx];

    for (let weekDay of Object.keys(peopleData[personIdx].week)) {
      if (
        personEntry.week[weekDay as keyof Week] === true &&
        projectEntry.week[weekDay as keyof Week] === true &&
        !this.referenceDateService.isPastDay(weekDay as keyof Week)
      ) {
        personEntry.week[weekDay as keyof Week] = {
          id: projectEntry.id,
          text: projectEntry.client,
        };
        projectEntry.week[weekDay as keyof Week] = {
          id: personEntry.id,
          text: personEntry.name,
          skill: personEntry.skill,
        };
      }
    }
    personEntry.daysLeft = getDaysLeft(personEntry.week);
    projectEntry.daysLeft = getDaysLeft(projectEntry.week);
    projectEntry.emailSent = false;
  };

  #clearWeek = ({
    peopleData,
    projectData,
    entry,
  }: {
    peopleData: Person[];
    projectData: Project[];
    entry: AllocationEntry;
  }) => {
    const { person, project } = entry;
    const entryID = person ? person.id : project?.id;
    const primaryDataSet = person ? peopleData : projectData;
    const secondaryDataSet = person ? projectData : peopleData;
    const primaryEntry = (primaryDataSet as any[]).find(
      (entry) => entry.id === entryID
    );

    // loop through person's / project's calendar
    for (let [key, val] of Object.entries(primaryEntry.week)) {
      // if value is an obj (not boolean), it means there's an allocation entry
      if (
        typeof val === 'object' &&
        !this.referenceDateService.isPastDay(key as keyof Week)
      ) {
        // change the value of weekday to true
        primaryEntry.week = {
          ...primaryEntry.week,
          [key]: true,
        };

        // find the index of the other entry (if person primary entry, then project and vice versa)
        const secondaryEntryIndex = secondaryDataSet.findIndex(
          (elem) => elem.id == (val as { id: string; text: string }).id
        );
        // change the value of that weekday to boolean true
        const secondaryEntryWeek = {
          ...secondaryDataSet[secondaryEntryIndex].week,
          [key]: true,
        };
        const secondaryEntryDaysLeft = getDaysLeft(secondaryEntryWeek);

        secondaryDataSet[secondaryEntryIndex] = {
          ...secondaryDataSet[secondaryEntryIndex],
          week: secondaryEntryWeek,
          daysLeft: secondaryEntryDaysLeft,
        };
        if ((secondaryDataSet[secondaryEntryIndex] as Project).emailSent) {
          (secondaryDataSet[secondaryEntryIndex] as Project).emailSent = false;
        }
      }
    }
    primaryEntry.daysLeft = getDaysLeft(primaryEntry.week);

    if (primaryEntry.emailSent) {
      primaryEntry.emailSent = false;
    }
  };

  #reallocatePerson = ({
    peopleData,
    projectData,
    newEntry,
  }: {
    peopleData: Person[];
    projectData: Project[];
    newEntry: AllocationEntry;
  }) => {
    const { person, project, day: dayFrom, reallocateTo } = newEntry;

    if (reallocateTo === undefined) {
      return;
    }
    const { day: dayTo } = reallocateTo;

    const personIdx = peopleData.findIndex((entry) => entry.id === person?.id);
    const currentProjectIndex = projectData.findIndex(
      (entry) => entry.id === project?.id
    );
    const newProjectIndex = projectData.findIndex(
      (entry) => entry.id === reallocateTo?.id
    );
    const newProject = projectData[newProjectIndex];

    const personWeek = {
      ...peopleData[personIdx].week,
      [dayFrom]: true,
      [dayTo]: !newProject
        ? true
        : {
            id: newProject.id,
            text: newProject.client,
          },
    };

    peopleData[personIdx] = {
      ...peopleData[personIdx],
      week: personWeek,
      daysLeft: getDaysLeft(personWeek),
    };

    const currentProjectWeek = {
      ...projectData[currentProjectIndex].week,
      [dayFrom]: true,
    };

    projectData[currentProjectIndex] = {
      ...projectData[currentProjectIndex],
      week: currentProjectWeek,
      daysLeft: getDaysLeft(currentProjectWeek),
      emailSent: false,
    };

    const newProjectWeek = {
      ...projectData[newProjectIndex].week,
      [dayTo]: !person?.value
        ? true
        : {
            id: person.id,
            text: person.value,
            skill: person.skill,
          },
    };

    projectData[newProjectIndex] = {
      ...projectData[newProjectIndex],
      week: newProjectWeek,
      daysLeft: getDaysLeft(newProjectWeek),
      emailSent: false,
    };
  };

  #reallocateProject = ({
    peopleData,
    projectData,
    newEntry,
  }: {
    peopleData: Person[];
    projectData: Project[];
    newEntry: AllocationEntry;
  }) => {
    const { person, project, day: dayFrom, reallocateTo } = newEntry;

    if (reallocateTo === undefined) {
      return;
    }
    const { day: dayTo } = reallocateTo;

    const projectIdx = projectData.findIndex(
      (entry) => entry.id === project?.id
    );
    const currentPersonIndex = peopleData.findIndex(
      (entry) => entry.id === person?.id
    );
    const newPersonIndex = peopleData.findIndex(
      (entry) => entry.id === reallocateTo?.id
    );

    const newPerson = peopleData[newPersonIndex];

    const projectWeek = {
      ...projectData[projectIdx].week,
      [dayFrom]: true,
      [dayTo]: !newPerson
        ? true
        : {
            id: newPerson.id,
            text: newPerson.name,
            skill: newPerson.skill,
          },
    };

    projectData[projectIdx] = {
      ...projectData[projectIdx],
      week: projectWeek,
      daysLeft: getDaysLeft(projectWeek),
      emailSent: false,
    };

    const currentPersonWeek = {
      ...peopleData[currentPersonIndex].week,
      [dayFrom]: true,
    };

    peopleData[currentPersonIndex] = {
      ...peopleData[currentPersonIndex],
      week: currentPersonWeek,
      daysLeft: getDaysLeft(currentPersonWeek),
    };

    const newPersonWeek = {
      ...peopleData[newPersonIndex].week,
      [dayTo]: !project?.value
        ? true
        : {
            id: project.id,
            text: project.value,
          },
    };

    peopleData[newPersonIndex] = {
      ...peopleData[newPersonIndex],
      week: newPersonWeek,
      daysLeft: getDaysLeft(newPersonWeek),
    };
  };

  // ********************
  // AUTO_ALLOCATION
  // ********************

  #canClearEntries(): boolean {
    if (!this.projectDataSet?.length) {
      return false;
    }

    for (let project of this.projectDataSet) {
      const { week } = project;

      for (let [day, entry] of Object.entries(week)) {
        if (
          typeof entry !== 'boolean' &&
          !this.referenceDateService.isPastDay(day as keyof Week)
        ) {
          return true;
        }
      }
    }

    return false;
  }

  #canAutoAllocateEntries(): boolean {
    if (!this.projectDataSet?.length || !this.peopleDataSet?.length) {
      return false;
    }

    let projectHasUnallocated = false;

    for (let project of this.projectDataSet) {
      const { week } = project;

      for (let [day, entry] of Object.entries(week)) {
        if (
          typeof entry === 'boolean' &&
          entry === true &&
          !this.referenceDateService.isPastDay(day as keyof Week)
        ) {
          projectHasUnallocated = true;
        }
      }
    }

    if (!projectHasUnallocated) {
      return false;
    }

    for (let project of this.peopleDataSet) {
      const { week } = project;

      for (let [day, entry] of Object.entries(week)) {
        if (
          typeof entry === 'boolean' &&
          entry === true &&
          !this.referenceDateService.isPastDay(day as keyof Week)
        ) {
          return true;
        }
      }
    }

    return false;
  }

  runClearAllocation() {
    if (!this.hasEntriesToClear) {
      return;
    }

    const { data: peopleData } = this.dataStoreService.getPeopleList(
      this.referenceDateService.referenceDate
    );

    const { data: projectData } = this.dataStoreService.getProjectList(
      this.referenceDateService.referenceDate
    );

    for (let person of peopleData) {
      const allocationEntry: AllocationEntry = {
        person: {
          id: person.id,
          value: null,
          skill: person.skill,
        },
        day: 'match',
      };

      this.#clearWeek({ peopleData, projectData, entry: allocationEntry });
    }

    this.#updateDataset(peopleData, projectData);
    this.#emitData();
  }

  runAutoAllocation(projectId?: string) {
    if (!this.hasEntriesToAutoAllocate) {
      return;
    }

    const { data: peopleData } = this.dataStoreService.getPeopleList(
      this.referenceDateService.referenceDate
    );

    let projectData: Project[] = [];

    if (projectId) {
      const project = this.dataStoreService
        .getProjectList(this.referenceDateService.referenceDate)
        .data.find(({ id }) => id === projectId);

      if (project) {
        projectData.push(project);
      }
    } else
      ({ data: projectData } = this.dataStoreService.getProjectList(
        this.referenceDateService.referenceDate
      ));

    const getPassPhase = (
      comments: ProfileConfig['comments'],
      tagThreshold: ProfileConfig['tagThreshold'],
      skill: ProfileConfig['skill'],
      days: ProfileConfig['days']
    ): ProfileConfig => {
      return {
        comments,
        days,
        skill,
        tagThreshold,
      };
    };

    const generatePassArrForTagThreshold = (
      tagThreshold: ProfileConfig['tagThreshold']
    ): ProfileConfig[] => {
      return [
        // full skill match, up to 2 days diff
        getPassPhase(false, tagThreshold, true, true),
        getPassPhase(false, tagThreshold, true, -1),
        getPassPhase(false, tagThreshold, true, -2),

        //  skill -1 match, up to 2 days diff
        getPassPhase(false, tagThreshold, -1, true),
        getPassPhase(false, tagThreshold, -1, -1),
        getPassPhase(false, tagThreshold, -1, -2),

        //  skill +1 match, up to 2 days diff
        getPassPhase(false, tagThreshold, 1, true),
        getPassPhase(false, tagThreshold, 1, -1),
        getPassPhase(false, tagThreshold, 1, -2),

        //  skill -2 match, up to 2 days diff
        getPassPhase(false, tagThreshold, -2, true),
        getPassPhase(false, tagThreshold, -2, -1),
        getPassPhase(false, tagThreshold, -2, -2),

        // 3-day diff within 2-point skill range
        getPassPhase(false, tagThreshold, true, -3),
        getPassPhase(false, tagThreshold, -1, -3),
        getPassPhase(false, tagThreshold, 1, -3),
        getPassPhase(false, tagThreshold, -2, -3),

        // up to 3-day diff 3 skill levels below
        getPassPhase(false, tagThreshold, -3, -1),
        getPassPhase(false, tagThreshold, -3, -2),
        getPassPhase(false, tagThreshold, -3, -3),
      ];
    };

    const passPhases: ProfileConfig[] = [
      getPassPhase(true, 0, false, false),
      getPassPhase(false, 90, true, true),
      ...generatePassArrForTagThreshold(70),
      ...generatePassArrForTagThreshold(50),
      ...generatePassArrForTagThreshold(20),
      ...generatePassArrForTagThreshold(0),
      // 4-day diff across all skill levels
      getPassPhase(false, 20, true, -4),
      getPassPhase(false, 20, -1, -4),
      getPassPhase(false, 20, 1, -4),
      getPassPhase(false, 20, -2, -4),
      getPassPhase(false, 20, -3, -4),

      // no day match, allocate whatever's left
      getPassPhase(false, 20, true, false),
      getPassPhase(false, 20, -1, false),
      getPassPhase(false, 20, 1, false),
      getPassPhase(false, 20, -2, false),
      getPassPhase(false, 20, -3, false),
      getPassPhase(false, 0, false, false),
    ];

    this.#sortListByOpenDays(peopleData, false);
    this.#sortListByOpenDays(projectData, false);

    for (let phase of passPhases) {
      if (phase.comments) {
        this.#allocateByComments(peopleData, projectData);
      } else {
        const [peopleAvail, projectsOpen] = this.#allocateByProfile(
          peopleData,
          projectData,
          phase
        );

        if (!peopleAvail || !projectsOpen) {
          break;
        }
      }
    }

    const projectArr = !projectId
      ? projectData
      : [
          ...this.dataStoreService.getProjectList(
            this.referenceDateService.referenceDate
          ).data,
        ];

    if (projectId) {
      // if project id provided, replace that project in project array with the modified object
      projectArr.splice(
        projectArr.findIndex(({ id }) => id === projectId),
        1,
        projectData[0]
      );
    }

    this.#updateDataset(peopleData, projectArr);
    this.#emitData();
  }

  #allocateByComments(peopleList: Person[], projectList: Project[]) {
    for (let person of peopleList) {
      const nameParsed = cleanString(person.name).toLowerCase();

      for (let project of projectList) {
        const commentParsed = project.comments
          ? cleanString(project.comments).toLowerCase()
          : undefined;

        if (!commentParsed) {
          continue;
        }

        const nameFound = commentParsed.match(new RegExp(`${nameParsed}`, 'i'));

        if (!nameFound) {
          continue;
        }

        const allocationEntry: AllocationEntry = {
          person: {
            id: person.id,
            value: person.name,
            skill: person.skill,
          },
          project: {
            id: project.id,
            value: project.client,
          },
          day: 'match',
        };

        this.#allocateFullWeek({
          projectData: projectList,
          peopleData: peopleList,
          newEntry: allocationEntry,
        });
      }
    }
  }

  #allocateByProfile(
    peopleList: Person[],
    projectList: Project[],
    profileConfig: ProfileConfig
  ): [number, number] {
    this.workInProgressSubject$.next(true);

    let peopleWithDaysAvail = peopleList.length;
    let projectsWithDaysAvail = projectList.length;

    for (let person of peopleList) {
      const personDays = Object.values(person.week).filter(
        (day) => typeof day === 'boolean' && day
      ).length;

      if (!personDays) {
        peopleWithDaysAvail--;

        continue;
      }
      let projectDays = 0;
      let matchedProject: Project | null = null;

      const tagsAboveThreshold = !profileConfig.tagThreshold
        ? []
        : person.tags.filter(
            (tag) => tag.percent && tag.percent >= profileConfig.tagThreshold
          );

      if (profileConfig.tagThreshold > 0 && !tagsAboveThreshold.length) {
        // console.log('====== BELOW TAG THRESHOLD =====');
        continue;
      }

      projectsWithDaysAvail = projectList.length;

      for (let project of projectList) {
        projectDays = Object.values(project.week).filter(
          (day) => typeof day === 'boolean' && day
        ).length;

        if (!projectDays) {
          projectsWithDaysAvail--;
          continue;
        }

        // if (project.client === clientNameToCheck) {
        //   if (person.name === personNameToCheck) {
        //     console.log({ project, projectDays });
        //   }
        // }

        // match skill
        const skillAdjustement =
          typeof profileConfig.skill === 'boolean' ? 0 : profileConfig.skill;
        const personPriority = project.priority
          ? matchSkillToProjectPriority(
              getSkillGroupColor(person.skill) as SkillColor,
              skillAdjustement
            )
          : 0;

        // if (person.name === personNameToCheck) {
        //   console.log({
        //     skillAdjustement,
        //     personPriority,
        //     projectPriority: project.priority,
        //     priorityMismatch: personPriority !== (project.priority || 0),
        //   });
        // }

        if (personPriority !== (project.priority || 0)) {
          continue;
        }

        // match tags
        if (profileConfig.tagThreshold > 0) {
          let tagsMatch = false;

          for (let personTag of tagsAboveThreshold) {
            tagsMatch = project.tags.some(
              (projectTag) =>
                projectTag.value === personTag.value &&
                personTag.percent &&
                personTag.percent >= profileConfig.tagThreshold
            );

            if (tagsMatch) {
              break;
            }
          }
          // if (person.name === personNameToCheck) {
          //   console.log({
          //     tagsMatch,
          //   });
          // }

          if (!tagsMatch) {
            // console.log('====== NO TAG MATCH =====');
            continue;
          }
        }

        let daysOverlap = 0;
        let overlapThresholdMet;

        for (let day of Object.keys(person.week)) {
          const personDayIsAvail =
            typeof person.week[day as keyof Week] === 'boolean' &&
            person.week[day as keyof Week];
          const projectDayIsAvail =
            typeof project.week[day as keyof Week] === 'boolean' &&
            project.week[day as keyof Week];

          if (personDayIsAvail && projectDayIsAvail) {
            daysOverlap++;
          }
        }

        if (profileConfig.days === true) {
          // full match required
          overlapThresholdMet = personDays === daysOverlap;
        } else if (profileConfig.days === false) {
          // no match required
          overlapThresholdMet = true;
        } else {
          // offset match required
          overlapThresholdMet = daysOverlap === profileConfig.days;
        }

        if (overlapThresholdMet) {
          console.log({ person, project, profileConfig, daysOverlap });
        }

        // match days
        // const daysOverlap =
        //   profileConfig.days === true // full match required
        //     ? projectDays === personDays
        //     : profileConfig.days === false // no match required
        //     ? true
        //     : Math.abs(projectDays - personDays) ===
        //       Math.abs(profileConfig.days); // partial match, e.g. person days = 4; project days = 2; diff: 2; if profileConfig.days === -2 (i.e. allows for a 2-day difference), there's a match
        //  Math.max(projectDays + profileConfig.days, 1); // partial match required (either -1 or -2 days)

        if (!overlapThresholdMet) {
          continue;
        }

        matchedProject = project;
      }

      if (matchedProject) {
        const allocationEntry: AllocationEntry = {
          person: {
            id: person.id,
            value: person.name,
            skill: person.skill,
          },
          project: {
            id: matchedProject.id,
            value: matchedProject.client,
          },
          day: 'match',
        };

        this.#allocateFullWeek({
          projectData: projectList,
          peopleData: peopleList,
          newEntry: allocationEntry,
        });
      }
    }

    this.workInProgressSubject$.next(false);

    return [peopleWithDaysAvail, projectsWithDaysAvail];
  }

  #sortListByOpenDays(list: Person[] | Project[], asc = true) {
    list.sort((a: Person | Project, b: Person | Project): number => {
      const aDays = Object.values(a.week).filter(
        (day) => typeof day === 'boolean' && day
      ).length;

      const bDays = Object.values(b.week).filter(
        (day) => typeof day === 'boolean' && day
      ).length;

      return asc ? aDays - bDays : bDays - aDays;
    });
  }
}
