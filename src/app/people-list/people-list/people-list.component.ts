import {
  Component,
  OnInit,
  Input,
  NgZone,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { FetchService } from 'src/app/shared-module/fetch.service';
import { TypeaheadService } from 'src/app/shared-module/typeahead.service';
import { ConfigService } from 'src/app/shared-module/config.service';
import { ResizeObserverService } from 'src/app/shared-module/resize-observer.service';
import {
  AllocateService,
  Dataset,
  DeletionEvent,
  SaveEvent,
  isInstanceOfSaveEvent,
  isInstanceOfDeleteEvent,
} from 'src/app/shared-module/allocate.service';
import { v4 as uuidv4 } from 'uuid';
import { Subscription } from 'rxjs';
import { PersonEditable } from '../person';
import { Tag } from 'src/app/shared-module/entry/entry.component';
import { Week } from 'src/app/shared-module/week-days/week';

import {
  PageComponent,
  SubmissionStatus,
} from 'src/app/shared-module/page/page.component';
import { getNewWeek, getDaysLeft } from '../../shared-module/week-days/week';
import { WeeklyData } from 'src/app/shared-module/fetch.service';

@Component({
  selector: 'people-list',
  templateUrl: './people-list.component.html',
  styleUrls: ['./people-list.component.scss'],
})
export class PeopleListComponent
  extends PageComponent
  implements OnInit, OnChanges
{
  @Input() displayedIn!: 'SUBMIT' | 'ALLOCATE';

  pdmFilter = new FormControl('All');
  skillFilter = new FormControl('All');
  showSubmitModal: boolean = false;
  status!: SubmissionStatus;
  statusLabel!: string;
  submitted!: boolean;
  boundGetNameTypeahead!: Function;
  pdmArr!: String[];

  subscription: Subscription = new Subscription();

  // arr used for storing entries modified by the project side of the app (e.g. by deleting project records - days free up then)
  // records are stored in this array until save / cancel event on the project side
  modifiedEntries: PersonEditable[] = [];

  constructor(
    private fetchService: FetchService,
    private allocateService: AllocateService,
    typeaheadService: TypeaheadService,
    resizeObserverService: ResizeObserverService,
    ngZone: NgZone,
    private configService: ConfigService
  ) {
    super(ngZone, resizeObserverService, typeaheadService);
  }

  // *****************
  // LIFECYCLE HOOKS
  // *****************

  ngOnInit(): void {
    this.boundGetNameTypeahead = this.getNameTypeAhead.bind(this);
    this.updateFilteredView();

    if (this.displayedIn === 'ALLOCATE') {
      this.subscribeToAllocationServices();
      this.entryContainerWidth = 1;
    }
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

    this.subscription.add(allocationDataSubscription);
    this.subscription.add(deleteRecordSubscription);
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
          daysLeft: getDaysLeft(updatedWeek as Week),
        };
      }
    );
    this.updateFilteredView();
  }

  // *****************
  // FILTER HANDLERS
  // *****************

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
      this.filters = [];
    } else {
      this.updateFilter('skill', skill);
    }

    this.updateFilteredView();
  }

  clearFilters(): void {
    this.filters = [];
    this.showAvailableOnly = false;
    this.pdmFilter.setValue('All');
    this.clearEditModeOptions();
    this.updateFilteredView();
  }

  clearEditModeOptions(): void {
    this.statusLabel = '';
    this.inEditMode = false;
    this.newRows = [];
  }

  updateStatusLabel() {
    if (!this.dataSet.length) {
      this.statusLabel = '';
      return;
    }
    if (this.status && this.pdmFilter.value === 'All') {
      if (!this.status.pending) {
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
        daysLeft: getDaysLeft(week),
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
      daysLeft: getDaysLeft(week),
      tags,
    });

    const indexToRemove: number = this.newRows.findIndex(
      (row) => row.id === id
    );

    this.newRows.splice(indexToRemove, 1);
    this.onChangeSaved();
  }

  // *****************
  // SUBMIT HANDLERS
  // *****************

  fetchData(refetching = true) {
    this.fetching = true;
    this.fetchError = '';
    this.noData = false;

    const submittedOnly = this.displayedIn === 'ALLOCATE';
    const skipLookupList = refetching;

    this.fetchService
      .fetchWeeklyList(this.referenceDate, skipLookupList, submittedOnly)
      .subscribe({
        next: (data: WeeklyData) => {
          this._onWeeklyData(data);
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
            dataType: 'people',
            data: this.dataSet as PersonEditable[],
            weekOf: this.referenceDate,
          });
        },
      });
  }

  _onWeeklyData(data: WeeklyData) {
    const { people, statusSummary, lookupTable, config } = data;

    this.dataSet = !people?.length
      ? []
      : this.sortService
          .sortData(
            people,
            this.sortService.SORT_COLUMNS.NAME,
            false,
            true,
            false
          )
          .map((person) => ({
            ...person,
            inEditMode: false,
            availDate: new Date(Date.parse(person.availDate)),
          }));

    // lookup table only sent on first fetch, where pdm not provided as parameter
    // if pdm provided as a parameter, he/she cancelled changes and is fetching the old list from server

    if (lookupTable) {
      this.typeaheadService.storeLookupList(
        this.typeaheadService.tableTypes.People,
        lookupTable
      );
    }

    if (config) {
      this.configService.setConfig(config);
    }

    this.status = statusSummary;
    this.updateStatusLabel();
    this.updateFilteredView();
  }

  postChanges() {
    this.fetching = true;
    const pdmParam =
      this.displayedIn !== 'ALLOCATE' ? this.pdmFilter.value : 'allocator';

    this.fetchService
      .saveList(
        this.referenceDate,
        pdmParam,
        (this.dataSet as any[]).map((person) => {
          const { inEditMode, ...otherProps } = person;

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
          this.fetching = false;
          this.setInEditMode(false);
        },
        complete: () => {},
      });
  }

  onSubmit() {
    this.showSubmitModal = true;
  }

  async handleModalClose(submit: boolean) {
    this.showSubmitModal = false;
    if (submit) {
      this.uploading = true;

      this.fetchService
        .submitList(
          this.referenceDate,
          this.pdmFilter.value,
          (this.filteredDataset as any[]).map((person) => {
            const { inEditMode, ...otherProps } = person;

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
          },
          complete: () => {
            this.uploading = false;
          },
        });
    }
  }

  handleDateChange(date: Date) {
    this.onDateChange(date);
    this.fetchData(false);
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
