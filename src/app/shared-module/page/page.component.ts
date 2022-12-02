import {
  Component,
  NgZone,
  AfterViewInit,
  ViewChild,
  ElementRef,
  Input,
} from '@angular/core';

import { Subject, pipe, takeUntil } from 'rxjs';

import { ResizeObserverService } from 'src/app/shared-module/resize-observer.service';
import { ReferenceDateService } from 'src/app/shared-module/reference-date.service';
import { SortService } from 'src/app/utils/sortService';
import { TypeaheadService } from '../typeahead.service';

import { PersonEditable, isPersonEditable } from 'src/app/people-list/person';
import { ProjectEditable } from 'src/app/project-list/project-list/project';
import { Week, getDaysLeft } from 'src/app/shared-module/week-days/week';

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
  @Input() excludePast: boolean = false;

  ngZone: NgZone;

  dataSet: (PersonEditable | ProjectEditable)[] = [];
  entryContainerWidth: number = 4;
  fetching: boolean = false;
  fetchError: string = '';
  filteredDataset: (PersonEditable | ProjectEditable)[] = this.dataSet;
  filters: Filter[] = [];
  inEditMode: boolean = false;
  lastDataUpdateTs: number = 0;
  newRows: (PersonEditable | ProjectEditable)[] = [];
  referenceDateService: ReferenceDateService;
  resizeObserverService: ResizeObserverService;
  resizeSubscription!: any;
  saveChangesInProgress: boolean = false;
  sortService: SortService = new SortService();
  showAvailableOnly: boolean = false;
  showPastRecordsLabel: boolean = false;
  typeaheadService!: TypeaheadService;
  uncollapsed: Set<string> = new Set();
  uploading: boolean = false;
  uploaded: boolean = false;

  onDestroy$: Subject<void> = new Subject<void>();

  constructor(
    ngZone: NgZone,
    resizeObserverService: ResizeObserverService,
    referenceDateService: ReferenceDateService,
    typeaheadService?: TypeaheadService
  ) {
    this.ngZone = ngZone;
    this.resizeObserverService = resizeObserverService;
    this.referenceDateService = referenceDateService;

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

  onPageInit(): void {
    this.referenceDateService.onReferenceDateChange$
      .pipe(takeUntil(this.onDestroy$))
      .subscribe(({ excludePast }) => {
        if (excludePast !== undefined) {
          this.updateFilteredView();
        }
      });
  }

  onPageDestroy(): void {
    this.resizeObserverService.deregisterElem(this.pageContainer.nativeElement);
    this.resizeSubscription.unsubscribe();
    this.onDestroy$.next();
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

  getFilteredView(data: (PersonEditable | ProjectEditable)[]): any[] {
    if (!this.filters.length) {
      return data;
    }

    return data.filter((entry) => {
      let daysLeftPass = true;
      let pdmPass = true;
      let skillPass = true;

      for (let filter of this.filters) {
        if (filter.field === 'days') {
          daysLeftPass =
            getDaysLeft(
              entry.week,
              this.referenceDateService.excludePast,
              this.referenceDateService.referenceDate
            ) > 0;
        }
        if (filter.field === 'pdm' && isPersonEditable(entry)) {
          pdmPass = entry.pdm === filter.value;
        }

        if (filter.field === 'skill' && isPersonEditable(entry)) {
          skillPass = entry.skill === filter.value;
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
        daysLeft: getDaysLeft(
          calendarObj,
          this.excludePast,
          this.referenceDate
        ),
      };
    });
    this.updateFilteredView();
  }

  updateTags(objParam: {
    id: string;
    value: string;
    type: string;
    percent?: number;
    action: 'add' | 'remove';
  }): void {
    const { id, value, type, action, percent } = objParam;

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
        ...(percent && {
          percent,
        }),
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
