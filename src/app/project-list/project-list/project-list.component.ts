import {
  Component,
  OnInit,
  NgZone,
  OnChanges,
  SimpleChanges,
  OnDestroy,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { FetchService } from '../../shared-module/fetch.service';
import { TypeaheadService } from '../../shared-module/typeahead.service';
import { ResizeObserverService } from 'src/app/shared-module/resize-observer.service';
import { ListEditModeStatusService } from 'src/app/shared-module/list-edit-mode-status.service';
import {
  AllocateService,
  Dataset,
  DeletionEvent,
  SaveEvent,
  isInstanceOfSaveEvent,
} from 'src/app/shared-module/allocate.service';
import { Week } from 'src/app/shared-module/week-days/week';
import { Tag } from 'src/app/shared-module/entry/entry.component';
import { v4 as uuidv4 } from 'uuid';
import { Subscription } from 'rxjs';
import { CsvParserService } from 'src/app/shared-module/csv-parser.service';
import {
  Project,
  ProjectEditable,
} from 'src/app/project-list/project-list/project';
import { PageComponent } from 'src/app/shared-module/page/page.component';
import { getNewWeek, getDaysLeft } from '../../shared-module/week-days/week';

export interface ContactEntry {
  first: string;
  last: string;
  email: string;
}

@Component({
  selector: 'project-list',
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.scss'],
})
export class ProjectListComponent
  extends PageComponent
  implements OnInit, OnChanges, OnDestroy
{
  projectFilter = new FormControl('All');
  allocationDataSubscription!: Subscription;
  deleteRecordSubscription!: Subscription;
  addressBook!: ContactEntry[];

  // arr used for storing entries modified by the people side of the app (e.g. by deleting people records - days free up then)
  // records are stored in this array until save / cancel event on the people side
  modifiedEntries: ProjectEditable[] = [];

  constructor(
    private fetchService: FetchService,
    private allocateService: AllocateService,
    typeaheadService: TypeaheadService,
    resizeObserverService: ResizeObserverService,
    private csvParserService: CsvParserService,
    ngZone: NgZone,
    private listEditModeStatusService: ListEditModeStatusService
  ) {
    super(ngZone, resizeObserverService, typeaheadService);
  }

  ngOnInit(): void {
    this.allocationDataSubscription = this.allocateService.onDataset.subscribe({
      next: (newData: Dataset) => {
        const { dataType, data } = newData;

        if (dataType === 'projects') {
          this.dataSet = this.sortService.applyCurrentSort(data);
          this.updateFilteredView();
        }
      },
      error: (err) => {
        this.fetchError = err;
      },
    });

    this.deleteRecordSubscription =
      this.allocateService.onDeleteRecord.subscribe({
        next: (data: DeletionEvent | SaveEvent) => {
          // save or discard changes
          if (isInstanceOfSaveEvent(data)) {
            const { save, issuedBy } = data;

            if (issuedBy === 'projects' || !this.modifiedEntries.length) {
              return;
            }

            if (save) {
              this.postChanges();
            } else {
              this.dataSet = this.dataSet.map((elem) => {
                const modified = this.modifiedEntries.find(
                  (modElem) => modElem.id === elem.id
                );

                if (modified) {
                  return modified;
                }

                return elem;
              });

              this.updateFilteredView();
            }
            this.modifiedEntries = [];
            return;
          }
          // clear projects' calendars if a person entry has been deleted
          const { deletedID, deletedRecordType, affectedSubIDs } = data;

          if (deletedRecordType === 'projects') {
            return;
          }

          this.dataSet = (this.dataSet as ProjectEditable[]).map(
            (elem: ProjectEditable): ProjectEditable => {
              if (!affectedSubIDs.includes(elem.id)) {
                return elem;
              }

              const elemCopy = JSON.parse(JSON.stringify(elem));
              this.modifiedEntries.push(elemCopy);

              const updatedWeek = Object.entries(elem.week).reduce(
                (acc, [key, val]): any => {
                  if (val.id === deletedID) {
                    return {
                      ...acc,
                      [key]: true,
                    };
                  }

                  return {
                    ...acc,
                    [key]: val,
                  };
                },
                {}
              );

              return {
                ...elem,
                week: updatedWeek as Week,
                daysLeft: getDaysLeft(updatedWeek as Week),
              };
            }
          );

          this.updateFilteredView();
        },
        error: (err) => {
          this.fetchError = err;
        },
      });

    const updateAddressBook = this._updateAddressBook.bind(this);

    this.fetchService.fetchContactData().subscribe({
      next: (data: string) => {
        try {
          this.csvParserService.parseContacts(data, updateAddressBook);
        } catch (e: any) {
          this.fetchError = 'Unable to load contacts';
        }
      },
      error: () => {
        this.fetchError = 'Cannot get contact list';
      },
    });
  }

  _updateAddressBook(addressBook: ContactEntry[]) {
    this.addressBook = addressBook;
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

  ngOnDestroy(): void {
    this.onPageDestroy();
    this.allocationDataSubscription.unsubscribe();
    this.deleteRecordSubscription.unsubscribe();
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
    doDuplicate?: boolean;
  }) {
    const { doDuplicate } = objParam;

    if (doDuplicate) {
      this.addProject({ ...objParam, existing: true });
      return;
    }

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
    doDuplicate?: boolean;
    existing?: boolean;
  }) {
    this.sortService.clearSort();
    const {
      id,
      client,
      type,
      comments,
      week,
      tags,
      availDate,
      leadership,
      doDuplicate,
      existing,
    } = objParam;

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

    const entryIndex: number = existing
      ? this.dataSet.findIndex((row) => row.id === id)
      : this.newRows.findIndex((row) => row.id === id);

    if (doDuplicate) {
      this.dataSet.splice(!existing ? entryIndex : entryIndex + 1, 0, {
        ...projectObj,
        id: uuidv4(),
        inEditMode: true,
      });
      this.updateFilteredView();
    } else {
      this.dataSet.unshift(projectObj);
      this.newRows.splice(entryIndex, 1);
      this.onChangeSaved();
    }
  }

  removeExistingRow(id: string): void {
    const removedEntry = this.dataSet.find((elem) => elem.id === id);
    if (!removedEntry) {
      return;
    }
    this.allocateService.handleDeleteRecord(removedEntry, 'projects');
    this.dataSet = this.dataSet.filter((entry) => entry.id !== id);
    this.updateFilteredView();
  }

  async fetchData() {
    this.fetching = true;
    this.fetchError = '';
    this.noData = false;

    this.fetchService.fetchProjectList(this.referenceDate).subscribe({
      next: (data: Project[]) => {
        const projects = !data?.length
          ? []
          : data.map((entry: any) => {
              const { availDate, ...otherProps } = entry;
              return {
                ...otherProps,
                availDate: new Date(Date.parse(availDate)),
              };
            });
        this.dataSet = this.sortService
          .sortData(
            projects,
            this.sortService.SORT_COLUMNS.NAME,
            false,
            true,
            false
          )
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
          weekOf: this.referenceDate,
        });
      },
    });
  }

  setInEditMode(inEditMode: boolean): void {
    this.inEditMode = inEditMode;

    if (inEditMode) {
      this.listEditModeStatusService.onEnterEditMode('projects');
    }
    if (!inEditMode) {
      this.newRows = [];
      this.listEditModeStatusService.onExitEditMode('projects');
    }
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

  handleFormPending(): void {
    setTimeout(() => {
      this.saveChangesInProgress = false;
    });
  }

  onChangeSaved(): void {
    if (this.saveChangesInProgress) {
      this.saveChanges();
      return;
    } else {
      this.updateFilteredView();
    }
  }

  saveChanges(): void {
    if (!this.checkIfAnyFormsOpen()) {
      setTimeout(() => {
        this.saveChangesInProgress = false;
        this.allocateService.registerSaveEvent(true, 'projects');
        this.updateFilteredView();
        this.postChanges();
        return;
      });
    }

    this.saveChangesInProgress = true;
  }

  cancelChanges(): void {
    this.allocateService.registerSaveEvent(false, 'projects');
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
