import { Component, OnInit, Input, NgZone } from '@angular/core';
import { FormControl } from '@angular/forms';
import { FetchService } from '../../shared-module/fetch.service';
import { TypeaheadService } from '../../shared-module/typeahead.service';
import { ResizeObserverService } from 'src/app/shared-module/resize-observer.service';
import { SortService } from 'src/app/shared-module/sort.service';
import { v4 as uuidv4 } from 'uuid';
import { getNewAvailDate, sortTags } from '../../utils/';
import {
  Project,
  ProjectEditable,
} from 'src/app/project-list/project-list/project';
import {
  PageComponent,
  SubmissionStatus,
  Filter,
} from 'src/app/shared-module/page/page.component';
import {
  Week,
  getNewWeek,
  getDaysLeft,
} from '../../shared-module/week-days/week';
import { timingSafeEqual } from 'crypto';

@Component({
  selector: 'project-list',
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.scss'],
})
export class ProjectListComponent extends PageComponent implements OnInit {
  projects!: Project[];
  projectFilteredView = this.projects;

  projectFilter = new FormControl('All');

  constructor(
    private fetchService: FetchService,
    typeaheadService: TypeaheadService,
    sortService: SortService,
    resizeObserverService: ResizeObserverService,
    ngZone: NgZone
  ) {
    super(ngZone, resizeObserverService, typeaheadService, sortService);
  }

  ngOnInit(): void {}

  clearFilters(): void {
    this.filters = [];
    this.showAvailableOnly = false;
    this.projectFilter.setValue('All');
    this.clearEditModeOptions();
    this.updateFilteredView();
  }

  clearEditModeOptions(): void {
    this.inEditMode = false;
    this.newRows = [];
  }

  addNewRow(): void {
    this.newRows.push({
      id: uuidv4(),
      client: '',
      type: 'LOP',
      leadership: [],
      week: getNewWeek(),
      daysLeft: 5,
      comments: '',
      tags: [],
      inEditMode: true,
    } as ProjectEditable);
  }

  async fetchData(forPDM: boolean = false) {
    setTimeout(() => {
      this.fetching = true;
      this.fetchError = '';
      this.noData = false;
    }, 0);

    try {
      const projects: Project[] = await this.fetchService.fetchProjectList(
        this.referenceDate
      );

      this.dataSet = this.sortService
        .sortData(projects, this.sortService.SORT_COLUMNS.NAME, false, true)
        .map((entry) => ({
          ...entry,
          inEditMode: false,
        }));

      this.updateFilteredView();
    } catch (e: any) {
      console.log({ e });
      if (e.message === 'Error: No data') {
        this.noData = true;
      } else {
        this.fetchError = e.message;
      }
    } finally {
      this.fetching = false;
    }
  }

  async postChanges() {
    this.uploading = true;

    try {
      await this.fetchService.saveProjectList(
        this.referenceDate,
        (this.filteredDataset as any[]).map((entry) => {
          const { inEditMode, ...otherProps } = entry;

          return {
            ...otherProps,
          };
        })
      );
      await this.fetchData();
    } catch (e: any) {
      this.fetchError = e;
    } finally {
      setTimeout(() => {
        this.uploading = false;
      }, 0);
    }
  }
  handleDateChange(date: Date) {
    this.onDateChange(date);
    this.fetchData();
  }

  onChangeSaved(): void {
    if (this.saveChangesInProgress && !this.checkIfAnyFormsOpen()) {
      this.saveChangesInProgress = false;
      this.setInEditMode(false);
      setTimeout(() => {
        this.postChanges();
      });
    }

    this.updateFilteredView();
  }

  cancelChanges(): void {
    this.onCancelChanges();
    this.fetchData(true);
    this.setInEditMode(false);
  }

  handleUpdateTags(objParam: {
    id: string;
    value: string;
    type: string;
    action: 'add' | 'remove';
  }): void {
    this.updateTags(objParam);
    this.onChangeSaved();
  }

  saveChanges(): void {
    if (!this.checkIfAnyFormsOpen()) {
      this.setInEditMode(false);
      this.updateFilteredView();
      this.postChanges();
      return;
    }

    this.saveChangesInProgress = true;
  }
}
