import {
  Component,
  OnInit,
  NgZone,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { FetchService } from '../../shared-module/fetch.service';
import { TypeaheadService } from '../../shared-module/typeahead.service';
import { ResizeObserverService } from 'src/app/shared-module/resize-observer.service';
import {
  AllocateService,
  Dataset,
} from 'src/app/shared-module/allocate.service';
import { Week } from 'src/app/shared-module/week-days/week';
import { Tag } from 'src/app/shared-module/entry/entry.component';
import { v4 as uuidv4 } from 'uuid';
import { Subscription } from 'rxjs';
import {
  Project,
  ProjectEditable,
} from 'src/app/project-list/project-list/project';
import { PageComponent } from 'src/app/shared-module/page/page.component';
import { getNewWeek, getDaysLeft } from '../../shared-module/week-days/week';

@Component({
  selector: 'project-list',
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.scss'],
})
export class ProjectListComponent
  extends PageComponent
  implements OnInit, OnChanges
{
  projectFilter = new FormControl('All');
  allocationDataSubscription!: Subscription;

  constructor(
    private fetchService: FetchService,
    private allocateService: AllocateService,
    typeaheadService: TypeaheadService,
    resizeObserverService: ResizeObserverService,
    ngZone: NgZone
  ) {
    super(ngZone, resizeObserverService, typeaheadService);
  }

  ngOnInit(): void {
    this.allocationDataSubscription = this.allocateService.onDataset.subscribe({
      next: (newData: Dataset) => {
        const { dataType, data } = newData;

        if (dataType === 'projects') {
          this.dataSet = data;
          this.updateFilteredView();
        }
      },
      error: (err) => {
        this.fetchError = err;
      },
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['referenceDate']) {
      const { currentValue } = changes['referenceDate'];
      const mil = currentValue.getMilliseconds();
      const secs = currentValue.getSeconds();
      if (mil === 0 && secs === 0) {
        this.handleDateChange(currentValue as Date);
      }
    }
  }

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

  handleDateChange(date: Date) {
    this.onDateChange(date);
    this.fetchData();
  }

  updateProjectDetails(objParam: {
    id: string;
    client: string;
    type: string;
    comments: string;
    availDate: Date;
    week: Week;
    tags: Tag[];
    leadership: string[];
  }) {
    const { id, client, type, comments, availDate, week, tags, leadership } =
      objParam;

    this.dataSet = this.dataSet.map((project) => {
      if (project.id !== id) {
        return project;
      }
      return {
        ...project,
        client,
        type,
        comments,
        availDate,
        daysLeft: getDaysLeft(week),
        leadership,
        week,
        tags,
        inEditMode: false,
      };
    });

    this.onChangeSaved();
  }

  addProject(objParam: {
    id: string;
    client: string;
    type: string;
    comments: string;
    availDate: Date;
    week: Week;
    tags: Tag[];
    leadership: string[];
  }) {
    this.sortService.clearSort();
    const { id, client, type, comments, week, tags, availDate, leadership } =
      objParam;

    const projectObj = {
      id,
      client,
      type,
      availDate,
      week,
      comments,
      inEditMode: false,
      daysLeft: getDaysLeft(week),
      tags,
      leadership,
    };

    this.dataSet.unshift(projectObj);

    const indexToRemove: number = this.newRows.findIndex(
      (row) => row.id === id
    );

    this.newRows.splice(indexToRemove, 1);
    this.onChangeSaved();
  }

  async fetchData() {
    this.fetching = true;
    this.fetchError = '';
    this.noData = false;

    this.fetchService.fetchProjectList(this.referenceDate).subscribe({
      next: (data: Project[]) => {
        const projects = data.map((entry: any) => {
          const { availDate, ...otherProps } = entry;
          return {
            ...otherProps,
            availDate: new Date(Date.parse(availDate)),
          };
        });
        this.dataSet = this.sortService
          .sortData(projects, this.sortService.SORT_COLUMNS.NAME, false, true)
          .map((entry) => ({
            ...entry,
            inEditMode: false,
          }));

        this.updateFilteredView();
      },
      error: (e) => {
        if (e.message === 'No data') {
          this.noData = true;
        } else {
          this.fetchError = e.message;
        }
        this.fetching = false;
        if (this.inEditMode) {
          this.setInEditMode(false);
        }
      },
      complete: () => {
        this.fetching = false;
        if (this.inEditMode) {
          this.setInEditMode(false);
        }
        this.allocateService.registerDataset({
          dataType: 'projects',
          data: this.dataSet as ProjectEditable[],
        });
      },
    });
  }

  async postChanges() {
    this.fetching = true;

    this.fetchService
      .saveProjectList(
        this.referenceDate,
        (this.dataSet as any[]).map((entry) => {
          const { inEditMode, ...otherProps } = entry;

          return {
            ...otherProps,
          };
        })
      )
      .subscribe({
        next: () => {
          this.fetchData();
        },
        error: (e) => {
          this.fetchError = e;
          this.uploading = false;
          this.setInEditMode(false);
        },
        complete: () => {},
      });
  }

  onChangeSaved(): void {
    if (this.saveChangesInProgress) {
      this.saveChanges();
      return;
    }
  }

  saveChanges(): void {
    if (!this.checkIfAnyFormsOpen()) {
      setTimeout(() => {
        this.saveChangesInProgress = false;
        this.updateFilteredView();
        this.postChanges();
        return;
      });
    }

    this.saveChangesInProgress = true;
  }

  cancelChanges(): void {
    this.onCancelChanges();
    this.fetchData();
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
}
