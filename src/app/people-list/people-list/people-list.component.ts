import { v4 as uuidv4 } from 'uuid';
import { Subscription } from 'rxjs';
import {
  Component,
  OnInit,
  Input,
  NgZone,
  OnChanges,
  SimpleChanges,
  OnDestroy,
} from '@angular/core';
import { FormControl } from '@angular/forms';

import { ConfigService } from 'src/app/shared-module/config.service';
import { DataStoreService } from 'src/app/shared-module/data-store.service';
import { FetchService } from 'src/app/shared-module/fetch.service';
import { IsOnlineService } from 'src/app/shared-module/is-online.service';
import { ListEditModeStatusService } from 'src/app/shared-module/list-edit-mode-status.service';
import { TypeaheadService } from 'src/app/shared-module/typeahead.service';
import { ResizeObserverService } from 'src/app/shared-module/resize-observer.service';
import { ReferenceDateService } from 'src/app/shared-module/reference-date.service';
import {
  AllocateService,
  Dataset,
  DeletionEvent,
  isInstanceOfSaveEvent,
  isInstanceOfDeleteEvent,
  SaveEvent,
} from 'src/app/shared-module/allocate.service';
import { WeeklyData } from 'src/app/shared-module/fetch.service';

import { Person, PersonEditable } from '../person';
import { Tag } from 'src/app/shared-module/entry/entry.component';
import { Week } from 'src/app/shared-module/week-days/week';

import {
  PageComponent,
  SubmissionStatus,
} from 'src/app/shared-module/page/page.component';

import { DataStore } from 'src/app/utils/StorageManager';
import { getClosestPastMonday } from 'src/app/utils';
import { getNewWeek, getDaysLeft } from '../../shared-module/week-days/week';
import { ProjectEditable } from 'src/app/project-list/project-list/project';

@Component({
  selector: 'people-list',
  templateUrl: './people-list.component.html',
  styleUrls: ['./people-list.component.scss'],
})
export class PeopleListComponent
  extends PageComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input() displayedIn!: 'SUBMIT' | 'ALLOCATE';
  @Input() peopleData!: any;

  boundGetNameTypeahead!: Function;
  pdmArr!: String[];
  pdmFilter = new FormControl('All');
  skillFilter = new FormControl('All');
  showSubmitModal: boolean = false;
  status!: SubmissionStatus;
  statusLabel!: string;
  submitted!: boolean;

  subscription: Subscription = new Subscription();

  // arr used for storing entries modified by the project side of the app (e.g. by deleting project records - days free up then)
  // records are stored in this array until save / cancel event on the project side
  modifiedEntries: PersonEditable[] = [];

  constructor(
    private allocateService: AllocateService,
    private configService: ConfigService,
    private dataStoreService: DataStoreService,
    private fetchService: FetchService,
    private isOnlineService: IsOnlineService,
    private listEditModeStatusService: ListEditModeStatusService,
    ngZone: NgZone,
    resizeObserverService: ResizeObserverService,
    referenceDateService: ReferenceDateService,
    typeaheadService: TypeaheadService
  ) {
    super(
      ngZone,
      resizeObserverService,
      referenceDateService,
      typeaheadService
    );
  }

  // *****************
  // LIFECYCLE HOOKS
  // *****************

  ngOnInit(): void {
    this.boundGetNameTypeahead = this.getNameTypeAhead.bind(this);
    this.updateFilteredView();
    this.subscribeToStoreServices();

    if (this.displayedIn === 'ALLOCATE') {
      this.subscribeToAllocationServices();
      this.entryContainerWidth = 1;
    }

    this.onPageInit();
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

  subscribeToAllocationServices(): void {
    const allocationDataSubscription = this.allocateService.onDataset.subscribe(
      {
        next: (newData: Dataset) => {
          const { dataType, data } = newData;

          if (dataType === 'people') {
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
          this._handleSaveOrDelete(data);
        },
        error: (err) => {
          this.fetchError = err;
        },
      });

    const workInProgressSubscription =
      this.allocateService.onWorkInProgress$.subscribe({
        next: (workInProgress: boolean) => {
          if (workInProgress && !this.fetching) {
            this.fetching = true;
          } else if (!workInProgress && this.fetching) {
            this.fetching = false;
          }
        },
      });

    this.subscription.add(allocationDataSubscription);
    this.subscription.add(deleteRecordSubscription);
    this.subscription.add(workInProgressSubscription);
  }

  subscribeToStoreServices() {
    const dataStoreSubscription = this.dataStoreService.storeData$.subscribe({
      next: (data: DataStore) => {
        const { updatedAtTs: peopleUpdatedAtTs } = data.people;
        const { updatedAtTs: masterUpdatedAtTs } = data.master;

        if (
          this.displayedIn === 'SUBMIT' &&
          masterUpdatedAtTs > this.lastDataUpdateTs
        ) {
          const newWeeklyData = this.dataStoreService.getWeeklyMasterList(
            this.referenceDate,
            false,
            data
          );

          this.#onNewWeeklyData(newWeeklyData);
          this.lastDataUpdateTs = masterUpdatedAtTs;
          this.onFetchCompleted();
        } else if (
          this.displayedIn === 'ALLOCATE' &&
          peopleUpdatedAtTs > this.lastDataUpdateTs
        ) {
          const ts = this.referenceDate.getTime();
          const people = data.people[ts];
          this.dataSet = this.parseAndSortPeopleData(people);
          this.updateFilteredView();
          this.lastDataUpdateTs = peopleUpdatedAtTs;
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

  _handleSaveOrDelete(data: DeletionEvent | SaveEvent) {
    // save or discard changes
    if (isInstanceOfSaveEvent(data)) {
      this._handleSave(data);
    } else if (isInstanceOfDeleteEvent(data)) {
      this._handleDelete(data);
    }
  }

  _handleSave(data: SaveEvent) {
    const { save, issuedBy } = data;

    if (issuedBy === 'people' || !this.modifiedEntries.length) {
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
  }

  _handleDelete(data: DeletionEvent) {
    // clear people's calendars if a project entry has been deleted
    const { deletedID, deletedRecordType, affectedSubIDs } = data;

    if (deletedRecordType === 'people') {
      return;
    }

    this.dataSet = (this.dataSet as PersonEditable[]).map(
      (elem: PersonEditable): PersonEditable => {
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
          daysLeft: getDaysLeft(
            updatedWeek as Week,
            this.excludePast,
            this.referenceDate
          ),
        };
      }
    );
    this.updateFilteredView();
  }

  setInEditMode(inEditMode: boolean): void {
    this.inEditMode = inEditMode;
    if (inEditMode) {
      this.listEditModeStatusService.onEnterEditMode('people');

      const closestLastMonday = getClosestPastMonday(new Date());
      if (this.referenceDate < closestLastMonday) {
        this.showPastRecordsLabel = true;
      }
    }

    if (!inEditMode) {
      this.newRows = [];
      this.showPastRecordsLabel = false;
      this.listEditModeStatusService.onExitEditMode('people');
    }
  }

  // *****************
  // FILTER HANDLERS
  // *****************

  clearPDMFilter() {
    this.filters = [];
    this.updateStatusLabel();
    // this.updateFilteredView();
    this.pdmFilter.setValue('All');
  }

  getPDMList(): string[] {
    if (!this.status) {
      return [];
    }

    return Object.values(this.status)
      .reduce((arr, subArr) => (arr = [...arr, ...subArr]), [])
      .sort();
  }

  updatePDMFilter(event: any): void {
    const pdm = event.target.value;
    this.clearEditModeOptions();

    if (pdm === 'All') {
      this.filters = [];
      this.updateStatusLabel();
    } else {
      this.updateFilter('pdm', pdm);
      this.updateStatusLabel();
    }

    this.updateFilteredView();
  }

  updateSkillFilter(event: any): void {
    const skill = event.target.value;

    if (skill === 'All') {
      this.filters = this.filters.filter(({ field }) => field === 'days'); // leave only days filter (if in array at all)
    } else {
      this.updateFilter('skill', skill);
    }

    this.updateFilteredView();
  }

  clearFilters(): void {
    this.filters = [];
    this.showAvailableOnly = false;
    this.pdmFilter.setValue('All');
    this.skillFilter.setValue('All');
    this.updateStatusLabel(true);
    this.updateFilteredView();
  }

  clearEditModeOptions(): void {
    this.inEditMode = false;
    this.newRows = [];
    this.updateStatusLabel();
  }

  updateStatusLabel(clearedFilters: boolean = false) {
    if (!this.dataSet.length) {
      this.statusLabel = '';
      return;
    }
    if (this.status && (clearedFilters || this.pdmFilter.value === 'All')) {
      if (!this.status.pending.length) {
        this.statusLabel = 'ready';
      } else {
        this.statusLabel = 'pending';
      }
      return;
    }

    const pdm = this.pdmFilter.value;

    try {
      Object.entries(this.status).forEach(
        ([status, pdmArr]: [string, string[]]) => {
          if (pdmArr.includes(pdm)) {
            this.statusLabel = status;
            if (status === 'done') {
              this.submitted = true;
            } else {
              this.submitted = false;
            }
            throw new Error('done');
          }
        }
      );
    } catch (e) {}
  }

  // *****************
  // EDIT HANDLERS
  // *****************

  addNewRow(): void {
    this.newRows.push({
      id: uuidv4(),
      name: '',
      skill: '',
      week: getNewWeek(),
      daysLeft: 5,
      comments: '',
      tags: [],
      inEditMode: true,
    } as PersonEditable);
  }

  removeExistingRow(id: string): void {
    const removedEntry = this.dataSet.find((elem) => elem.id === id);
    if (!removedEntry) {
      return;
    }
    this.allocateService.handleDeleteRecord(removedEntry, 'people');
    this.dataSet = this.dataSet.filter((entry) => entry.id !== id);
    this.updateFilteredView();
  }

  updateLookupTable() {
    this.typeaheadService.storeLookupList(
      this.typeaheadService.tableTypes.People,
      this.dataStoreService.getLookupTable()
    );
  }

  updatePersonDetails(objParam: {
    id: string;
    name: string;
    skill: string;
    comments?: string;
    availDate?: Date;
    pdm?: string;
    week: Week;
    tags: Tag[];
  }) {
    const { id, name, skill, comments, availDate, pdm, week, tags } = objParam;

    this.dataSet = this.dataSet.map((person) => {
      if (person.id !== id) {
        return person;
      }
      return {
        ...person,
        name,
        skill,
        comments,
        availDate,
        daysLeft: getDaysLeft(week, this.excludePast, this.referenceDate),
        pdm,
        week,
        tags,
        inEditMode: false,
      };
    });

    this.onChangeSaved();
  }

  addPerson(objParam: {
    id: string;
    name: string;
    skill: string;
    comments?: string;
    availDate?: Date;
    pdm?: string;
    week: Week;
    tags: Tag[];
  }) {
    this.sortService.clearSort();
    const { id, name, skill, comments, week, tags, availDate, pdm } = objParam;

    this.dataSet.unshift({
      id,
      name,
      skill,
      availDate,
      week,
      pdm,
      comments,
      inEditMode: false,
      daysLeft: getDaysLeft(week, this.excludePast, this.referenceDate),
      tags,
    });

    const indexToRemove: number = this.newRows.findIndex(
      (row) => row.id === id
    );

    this.newRows.splice(indexToRemove, 1);
    this.onChangeSaved();
  }

  // *****************
  // UPDATING VIEW
  // *****************

  parseAndSortPeopleData(people: Person[]): PersonEditable[] {
    const peopleList = !people?.length
      ? []
      : this.sortService.applyCurrentSort(people).map((person) => ({
          ...person,
          inEditMode: false,
          availDate: new Date(Date.parse(person.availDate)),
        }));

    return peopleList;
  }

  #onNewWeeklyData(data: WeeklyData) {
    this._onWeeklyData(data);
    this.allocateService.registerDataset({
      dataType: 'people',
      data: this.dataSet as PersonEditable[],
      weekOf: this.referenceDate,
    });
    this.updateLookupTable();
  }

  _onWeeklyData(data: WeeklyData) {
    const { people, statusSummary } = data;

    this.dataSet = this.parseAndSortPeopleData(people);

    // [Comment applying to online mode only]
    // lookup table only sent on first fetch, where pdm not provided as parameter
    // if pdm provided as a parameter, he/she cancelled changes and is fetching the old list from server

    this.status = statusSummary;
    this.updateStatusLabel();
    this.updateFilteredView();
  }

  // *****************
  // SUBMIT HANDLERS
  // *****************

  fetchData(refetching = true) {
    this.fetching = true;
    this.fetchError = '';

    if (this.isOnlineService.isOnline) {
      this.#fetchFromOnlineStore(refetching);
    } else {
      this.#fetchFromLocalStore();
    }
  }

  #fetchFromOnlineStore(refetching = true) {
    // const submittedOnly = this.displayedIn === 'ALLOCATE';
    // const skipLookupList = refetching;
    // this.fetchService
    //   .fetchWeeklyList(this.referenceDate, skipLookupList, submittedOnly)
    //   .subscribe({
    //     next: (data: WeeklyData) => {
    //       this._onWeeklyData(data);
    //     },
    //     error: (e) => {
    //       this.fetchError = e.message;
    //       this.fetching = false;
    //       if (this.inEditMode) {
    //         this.setInEditMode(false);
    //       }
    //     },
    //     complete: () => {
    //       this.onFetchCompleted();
    //     },
    //   });
  }

  #fetchFromLocalStore() {
    if (this.displayedIn === 'ALLOCATE') {
      this.#fetchDataForAllocateSection();
    } else {
      this.#fetchDataForSubmitSection();
    }
  }

  #fetchDataForSubmitSection() {
    const data = this.dataStoreService.getWeeklyMasterList(
      this.referenceDate,
      false
    );

    if (data) {
      this.#onNewWeeklyData(data);
    } else {
      this.fetchError = 'No data available';
    }

    this.onFetchCompleted();
  }

  #fetchDataForAllocateSection() {
    const { data, updatedAtTs } = this.dataStoreService.getPeopleList(
      this.referenceDate
    );

    if (data) {
      this.dataSet = this.parseAndSortPeopleData(data);
      this.lastDataUpdateTs = updatedAtTs;
      this.updateFilteredView();
    }

    this.onFetchCompleted();
  }

  onFetchCompleted() {
    this.fetching = false;

    if (this.inEditMode) {
      this.setInEditMode(false);
    }

    this.allocateService.registerDataset({
      dataType: 'people',
      data: this.dataSet as PersonEditable[],
      weekOf: this.referenceDate,
    });
  }

  postChanges() {
    this.fetching = true;
    this.fetchError = '';
    const pdmParam =
      this.displayedIn !== 'ALLOCATE' ? this.pdmFilter.value : 'allocator';

    const dataset =
      this.displayedIn !== 'ALLOCATE'
        ? (this.filteredDataset as ProjectEditable[])
        : (this.dataSet as ProjectEditable[]);

    const mappedDataset = (dataset as any[]).map((person) => {
      const { inEditMode, ...otherProps } = person;

      return {
        ...otherProps,
      };
    }) as Person[];

    if (this.isOnlineService.isOnline) {
      this.#postToOnlineStore(pdmParam, mappedDataset);
    } else {
      this.#postToLocalStore(pdmParam, mappedDataset);
    }
  }

  #postToOnlineStore(pdmParam: string, dataset: Person[]) {
    this.fetchService
      .saveList(this.referenceDate, pdmParam, dataset)
      .subscribe({
        next: () => {
          this.fetchData();
        },
        error: (e) => {
          this.fetchError = e;
          this.fetching = false;
          this.setInEditMode(false);
        },
        complete: () => {
          this.fetching = false;
        },
      });
  }

  #postToLocalStore(pdmParam: string, dataset: Person[]) {
    this.dataStoreService.saveChangesToPeopleList(
      this.referenceDate,
      pdmParam,
      dataset
    );
    this.setInEditMode(false);
    this.fetching = false;
  }

  onSubmit() {
    this.showSubmitModal = true;
  }

  async handleModalClose(submit: boolean) {
    this.showSubmitModal = false;
    if (submit) {
      this.uploading = true;
      const dataset = (this.filteredDataset as any[]).map((person) => {
        const { inEditMode, ...otherProps } = person;

        return {
          ...otherProps,
        };
      });
      if (this.isOnlineService.isOnline) {
        this.#submitToOnlineStore(dataset);
      } else {
        this.#submitToLocalStore(dataset);
      }
    }
  }

  #submitToOnlineStore(dataset: Person[]) {
    this.fetchService
      .submitList(this.referenceDate, this.pdmFilter.value, dataset)
      .subscribe({
        next: () => {
          this.fetchData();
        },
        error: (e) => {
          this.fetchError = e;
          this.uploading = false;
        },
        complete: () => {
          this.uploading = false;
        },
      });
  }

  #submitToLocalStore(dataset: Person[]) {
    this.dataStoreService.submitPeopleList(
      this.referenceDate,
      this.pdmFilter.value,
      dataset
    );
    this.uploading = false;
  }

  handleDateChange(date: Date) {
    this.clearPDMFilter();
    this.onDateChange(date);
    this.fetchData(false);
  }

  handleFormPending(): void {
    setTimeout(() => {
      this.saveChangesInProgress = false;
    }, 0);
  }

  onChangeSaved(): void {
    if (this.saveChangesInProgress) {
      this.saveChanges();
      return;
    } else {
      this.updateFilteredView();
    }
  }

  cancelChanges(): void {
    this.allocateService.registerSaveEvent(false, 'people');
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

  saveChanges(): void {
    if (!this.checkIfAnyFormsOpen()) {
      setTimeout(() => {
        this.saveChangesInProgress = false;
        this.allocateService.registerSaveEvent(true, 'people');
        this.updateFilteredView();
        this.postChanges();
        return;
      });
    }

    this.saveChangesInProgress = true;
  }
}
