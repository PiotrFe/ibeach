import { v4 as uuidv4 } from 'uuid';
import { Subscription } from 'rxjs';
import {
  Component,
  Input,
  OnInit,
  NgZone,
  OnChanges,
  SimpleChanges,
  OnDestroy,
} from '@angular/core';
import { AllocationToCSV } from 'src/app/shared-module/allocation-to-csv.class';
import { FormControl } from '@angular/forms';
import { ContactEntry } from 'src/app/utils/StorageManager';
import { CsvParserService } from 'src/app/shared-module/csv-parser.service';
import { DataStoreService } from 'src/app/shared-module/data-store.service';
import { FetchService } from '../../shared-module/fetch.service';
import { IsOnlineService } from 'src/app/shared-module/is-online.service';
import { ListEditModeStatusService } from 'src/app/shared-module/list-edit-mode-status.service';
import { ResizeObserverService } from 'src/app/shared-module/resize-observer.service';
import { TypeaheadService } from '../../shared-module/typeahead.service';
import {
  AllocateService,
  Dataset,
  DeletionEvent,
  SaveEvent,
  isInstanceOfSaveEvent,
} from 'src/app/shared-module/allocate.service';

import { PageComponent } from 'src/app/shared-module/page/page.component';
import { DataStore, WeeklyProjectList } from 'src/app/utils/StorageManager';

import {
  LeadershipEntry,
  Project,
  ProjectEditable,
} from 'src/app/project-list/project-list/project';
import { Week } from 'src/app/shared-module/week-days/week';
import { Tag } from 'src/app/shared-module/entry/entry.component';

import { getNewWeek, getDaysLeft } from '../../shared-module/week-days/week';
import { getClosestPastMonday, exportProjectListToPDF } from 'src/app/utils';

@Component({
  selector: 'project-list',
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.scss'],
})
export class ProjectListComponent
  extends PageComponent
  implements OnInit, OnChanges, OnDestroy
{
  allocationDataSubscription!: Subscription;
  deleteRecordSubscription!: Subscription;
  subscription: Subscription = new Subscription();
  projectFilter = new FormControl('All');

  // arr used for storing entries modified by the people side of the app (e.g. by deleting people records - days free up then)
  // records are stored in this array until save / cancel event on the people side
  modifiedEntries: ProjectEditable[] = [];

  boundGetClientTypeahead!: Function;

  constructor(
    private fetchService: FetchService,
    private allocateService: AllocateService,
    private dataStoreService: DataStoreService,
    private isOnlineService: IsOnlineService,
    typeaheadService: TypeaheadService,
    resizeObserverService: ResizeObserverService,
    private csvParserService: CsvParserService,
    ngZone: NgZone,
    private listEditModeStatusService: ListEditModeStatusService
  ) {
    super(ngZone, resizeObserverService, typeaheadService);
  }

  ngOnInit(): void {
    this.boundGetClientTypeahead = this.getClientTypeAhead.bind(this);
    this.subscribeToServices();
  }

  subscribeToServices() {
    const allocationDataSubscription = this.allocateService.onDataset.subscribe(
      {
        next: (newData: Dataset) => {
          const { dataType, data } = newData;

          if (dataType === 'projects') {
            this.dataSet = this.sortService.applyCurrentSort(data);
            this.updateFilteredView();

            // post changes to store in the offline mode
            // (allocation service does not do it)
            if (!this.isOnlineService.isOnline) {
              this.postChanges();
            }
          }
        },
        error: (err) => {
          this.fetchError = err;
        },
      }
    );

    const deleteRecordSubscription =
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

    this.subscription.add(allocationDataSubscription);
    this.subscription.add(deleteRecordSubscription);

    if (this.isOnlineService.isOnline) {
      const fetchSubscription = this.fetchService.fetchContactData().subscribe({
        next: (data: string) => {
          try {
            this.csvParserService.parseContacts(
              data,
              this.dataStoreService.saveContactList
            );
          } catch (e: any) {
            this.fetchError = 'Unable to load contacts';
          }
        },
        error: () => {
          this.fetchError = 'Cannot get contact list';
        },
      });

      this.subscription.add(fetchSubscription);
    } else {
      this.subscribeToStoreServices();
    }
  }

  subscribeToStoreServices() {
    const dataStoreSubscription = this.dataStoreService.storeData$.subscribe({
      next: (data: DataStore) => {
        const ts = this.referenceDate.getTime();
        const newWeeklyData = data.projects[ts];
        const { updatedAtTs } = data.projects;

        if (newWeeklyData && updatedAtTs > this.lastDataUpdateTs) {
          this.dataSet = this.parseAndSortProjectData(newWeeklyData);
          this.updateFilteredView();
          this.lastDataUpdateTs = updatedAtTs;
          this.updateLookupTable();
          this.onFetchCompleted();
        }
      },
      error: (err) => {
        this.fetchError = err;
      },
    });

    this.subscription.add(dataStoreSubscription);
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
    if (this.subscription) {
      this.subscription.unsubscribe();
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
        leadership: leadership.map<LeadershipEntry>((str) =>
          str.match(/\*/i)
            ? {
                name: str,
                mainContact: true,
              }
            : {
                name: str,
                mainContact: false,
              }
        ),
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
      leadership: leadership.map<LeadershipEntry>((str) =>
        str.match(/\*/i)
          ? {
              name: str,
              mainContact: true,
            }
          : {
              name: str,
              mainContact: false,
            }
      ),
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

  updateLookupTable() {
    this.typeaheadService.storeLookupList(
      this.typeaheadService.tableTypes.Projects,
      this.dataStoreService.getLookupTable('projects')
    );
  }

  setInEditMode(inEditMode: boolean): void {
    this.inEditMode = inEditMode;

    if (inEditMode) {
      this.listEditModeStatusService.onEnterEditMode('projects');

      const closestLastMonday = getClosestPastMonday(new Date());
      if (this.referenceDate < closestLastMonday) {
        this.showPastRecordsLabel = true;
      }
    }
    if (!inEditMode) {
      this.newRows = [];
      this.showPastRecordsLabel = false;
      this.listEditModeStatusService.onExitEditMode('projects');
    }
  }

  markEmailSent(id: string, sent: boolean = true): void {
    const idx = this.dataSet.findIndex((entry) => entry.id === id);

    this.dataSet[idx] = {
      ...this.dataSet[idx],
      emailSent: sent,
    };
    this.updateFilteredView();
    this.postChanges();
  }

  parseAndSortProjectData(projects: Project[]) {
    const projectList = !projects?.length
      ? []
      : this.sortService.applyCurrentSort(projects).map((project) => {
          return {
            ...project,
            inEditMode: false,
            availDate: new Date(Date.parse(project.availDate)),
          };
        });

    return projectList;
  }

  onFetchCompleted() {
    this.fetching = false;
    if (this.inEditMode) {
      this.setInEditMode(false);
    }
    this.allocateService.registerDataset({
      dataType: 'projects',
      data: this.dataSet as ProjectEditable[],
      weekOf: this.referenceDate,
    });
  }

  // ******************************
  // DATA STORE FNs
  // ******************************

  fetchData() {
    this.fetching = true;
    this.fetchError = '';

    if (this.isOnlineService.isOnline) {
      this.#fetchDataFromOnlineStore();
    } else {
      this.#fetchDataFromLocalStore();
    }
  }

  #fetchDataFromOnlineStore() {
    // this.fetchService.fetchProjectList(this.referenceDate).subscribe({
    //   next: (data: Project[]) => {
    //     this.parseAndSortProjectData(data);
    //   },
    //   error: (e) => {
    //     this.fetchError = e.message;
    //     this.fetching = false;
    //     if (this.inEditMode) {
    //       this.setInEditMode(false);
    //     }
    //   },
    //   complete: () => {
    //     this.onFetchCompleted();
    //   },
    // });
  }

  #fetchDataFromLocalStore() {
    const weeklyList: WeeklyProjectList = this.dataStoreService.getProjectList(
      this.referenceDate
    );

    const { data, updatedAtTs } = weeklyList;

    if (data) {
      this.dataSet = this.parseAndSortProjectData(data);
      this.lastDataUpdateTs = updatedAtTs;
      this.updateFilteredView();
    }

    this.onFetchCompleted();
  }

  postChanges() {
    this.fetching = true;
    const data: Project[] = (this.dataSet as any[]).map((entry) => {
      const { inEditMode, ...otherProps } = entry;

      return {
        ...otherProps,
      };
    });

    if (this.isOnlineService.isOnline) {
      this.#postChangesToOnlineStore(data);
    } else {
      this.#postChangesToLocalStore(data);
    }
  }

  #postChangesToOnlineStore(data: Project[]) {
    this.fetchService.saveProjectList(this.referenceDate, data).subscribe({
      next: () => {
        this.fetchData();
      },
      error: (e) => {
        this.fetchError = e;
        this.fetching = true;
        this.setInEditMode(false);
      },
      complete: () => {},
    });
  }

  #postChangesToLocalStore(data: Project[]) {
    this.dataStoreService.saveChangesToProjectList(this.referenceDate, data);
    this.setInEditMode(false);
    this.fetching = false;
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

  downloadProjectList(): void {
    // exportProjectListToPDF(this.pageContainer.nativeElement);
    const csv = AllocationToCSV.exportDataToCSV(
      this.dataSet as ProjectEditable[]
    );
    const universalBOM = '\uFEFF';

    const link = document.createElement('a');
    link.setAttribute('download', 'assignments.csv');
    link.setAttribute(
      'href',
      'data:text/csv; charset=utf-8,' + encodeURIComponent(universalBOM + csv)
    );
    link.click();
    URL.revokeObjectURL(link.href);
  }

  // **************
  // TYPEAHEADS
  // **************
  getClientTypeAhead(): string[] {
    return this.typeaheadService.getTypeahead(
      this.typeaheadService.fields.Client,
      this.dataSet
    );
  }
}
