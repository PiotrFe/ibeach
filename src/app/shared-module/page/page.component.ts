import {
  Component,
  NgZone,
  AfterViewInit,
  ViewChild,
  ElementRef,
  Input,
} from '@angular/core';

import { ResizeObserverService } from 'src/app/shared-module/resize-observer.service';
import { SortService } from 'src/app/utils/sortService';
import { TypeaheadService } from '../typeahead.service';

import { PersonEditable } from 'src/app/people-list/person';
import { ProjectEditable } from 'src/app/project-list/project-list/project';
import { Week } from 'src/app/shared-module/week-days/week';

import { getDaysLeft } from 'src/app/shared-module/week-days/week';
import { getNewAvailDate, sortTags } from 'src/app/utils';

export interface Filter {
  field: string;
  value?: string;
}

export interface SubmissionStatus {
  pending: string[];
  done: string[];
}

export const PAGE_TYPES = {
  PEOPLE: 'PEOPLE',
  PROJECTS: 'PROJECTS',
};

@Component({
  template: '',
})
export class PageComponent implements AfterViewInit {
  @ViewChild('page') pageContainer!: ElementRef;
  @Input() referenceDate: Date = new Date();

  ngZone: NgZone;

  dataSet: (PersonEditable | ProjectEditable)[] = [];
  filteredDataset: (PersonEditable | ProjectEditable)[] = this.dataSet;
  newRows: (PersonEditable | ProjectEditable)[] = [];

  inEditMode: boolean = false;
  showPastRecordsLabel: boolean = false;
  filters: Filter[] = [];

  noData: boolean = false;
  showAvailableOnly: boolean = false;

  saveChangesInProgress: boolean = false;

  uploading: boolean = false;
  uploaded: boolean = false;
  fetching: boolean = false;
  fetchError: string = '';

  uncollapsed: Set<string> = new Set();
  sortService: SortService = new SortService();
  typeaheadService!: TypeaheadService;
  resizeObserverService: ResizeObserverService;

  entryContainerWidth: number = 4;
  resizeSubscription!: any;

  constructor(
    ngZone: NgZone,
    resizeObserverService: ResizeObserverService,
    typeaheadService?: TypeaheadService
  ) {
    this.ngZone = ngZone;
    this.resizeObserverService = resizeObserverService;

    if (typeaheadService) {
      this.typeaheadService = typeaheadService;
    }
  }

  ngAfterViewInit(): void {
    const thisID = this.pageContainer.nativeElement.id;
    this.resizeObserverService.registerElem(this.pageContainer.nativeElement);

    this.resizeSubscription =
      this.resizeObserverService.currentWidth$.subscribe(
        ([elemID, width]: [string, number]) => {
          this.ngZone.run(() => {
            if (thisID === elemID && this.entryContainerWidth !== width) {
              setTimeout(() => {
                this.entryContainerWidth = width;
              }, 0);
            }
          });
        }
      );
  }

  onPageDestroy(): void {
    this.resizeObserverService.deregisterElem(this.pageContainer.nativeElement);
    this.resizeSubscription.unsubscribe();
  }

  // ********************
  // FILTERING
  // ********************

  updateFilter(field: string, value: string) {
    this.filters = this.filters.filter(
      (filter: Filter) => filter.field !== field
    );

    if (field !== 'All') {
      this.filters.push({
        field,
        value,
      });
    }
  }

  toggleShowAvailableOnly(): void {
    this.showAvailableOnly = !this.showAvailableOnly;

    if (this.showAvailableOnly) {
      this.filters.push({
        field: 'days',
      });
    } else {
      this.filters = this.filters.filter(
        (filter: Filter) => filter.field !== 'days'
      );
    }

    this.updateFilteredView();
  }

  getFilteredView(data: any[]): any[] {
    if (!this.filters.length) {
      return data;
    }

    return data.filter((entry) => {
      let daysLeftPass = true;
      let pdmPass = true;
      let skillPass = true;

      for (let filter of this.filters) {
        if (filter.field === 'days') {
          daysLeftPass = entry.daysLeft > 0;
        }
        if (filter.field === 'pdm') {
          pdmPass = entry.pdm === filter.value;
        }

        if (filter.field === 'skill') {
          pdmPass = entry.skill === filter.value;
        }
      }

      return daysLeftPass && pdmPass && skillPass;
    });
  }

  getClearFilterBtnClass(): string {
    const baseClass = 'bi bi-x-circle-fill icon-menu fs-12';
    const otherClasses = [];
    if (this.filters.length) {
      otherClasses.push(' clickable');
    } else {
      otherClasses.push(' btn-inactive');
      otherClasses.push('btn-grayed-out');
    }

    const otherClsStr = otherClasses.join(' ');
    return `${baseClass}${otherClsStr}`;
  }

  updateFilteredView(): void {
    this.filteredDataset = this.getFilteredView(this.dataSet);
  }

  // ********************
  // COLLAPSING
  // ********************

  handleCollapse(event: { id: string; collapsed: boolean }): void {
    const { id, collapsed } = event;
    const newVal = !collapsed;

    if (!newVal) {
      this.uncollapsed.delete(id);
    } else {
      this.uncollapsed.add(id);
    }
  }

  isCollapsed(id: string): boolean {
    return !this.uncollapsed.has(id);
  }

  // ********************
  // SORTING
  // ********************

  handleSort(colName: string) {
    this.dataSet = this.sortService.sortData(this.dataSet, colName);
    this.updateFilteredView();
  }

  // ********************
  // EDITING
  // ********************

  getNameTypeAhead(): string[] {
    return this.typeaheadService.getTypeahead(
      this.typeaheadService.fields.Name,
      this.dataSet
    );
  }

  checkIfAnyFormsOpen = (): boolean => {
    const atLeastOneFormOpen =
      this.dataSet.find(
        (entry: ProjectEditable | PersonEditable) => entry.inEditMode
      ) || this.newRows.length > 0;

    return Boolean(atLeastOneFormOpen);
  };

  removeRow(id: string): void {
    this.newRows = this.newRows.filter((item) => item.id !== id);
  }

  editRow(id: string): void {
    const idx = this.dataSet.findIndex((entry) => entry.id === id);

    this.dataSet[idx] = {
      ...this.dataSet[idx],
      inEditMode: true,
    };
    this.updateFilteredView();
  }

  updateCalendar(objParam: { id: string; calendarObj: Week }): void {
    const { calendarObj, id } = objParam;
    const newAvailDate = getNewAvailDate(calendarObj, this.referenceDate);

    this.dataSet = this.dataSet.map((entry) => {
      if (entry.id !== id) {
        return entry;
      }
      return {
        ...entry,
        availDate: newAvailDate,
        week: {
          ...calendarObj,
        },
        daysLeft: getDaysLeft(calendarObj),
      };
    });
    this.updateFilteredView();
  }

  updateTags(objParam: {
    id: string;
    value: string;
    type: string;
    action: 'add' | 'remove';
  }): void {
    const { id, value, type, action } = objParam;

    const entryIdx: number | undefined = this.dataSet.findIndex(
      (person) => person.id === id
    );

    if (typeof entryIdx === undefined) {
      return;
    }

    const person = this.dataSet[entryIdx];
    const tags = [...person.tags];

    if (action === 'add') {
      tags.push({
        value,
        type,
      });
    }
    if (action === 'remove') {
      const tagIdx = tags.findIndex((tag) => tag.value === value);
      tags.splice(tagIdx, 1);
    }

    this.dataSet[entryIdx] = {
      ...person,
      tags: sortTags(tags),
    };
  }

  onDateChange(date: Date) {
    this.referenceDate = date;
    this.referenceDate.setHours(0, 0, 0, 0);
    this.dataSet = [];
    setTimeout(() => {
      this.updateFilteredView();
    }, 0);
  }

  onCancelChanges(): void {
    this.dataSet = this.dataSet.map(
      (entry: PersonEditable | ProjectEditable) => ({
        ...entry,
        inEditMode: false,
      })
    );
  }
}
