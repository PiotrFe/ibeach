import {
  Component,
  OnInit,
  Input,
  NgZone,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { FetchService } from '../../shared-module/fetch.service';
import { TypeaheadService } from '../../shared-module/typeahead.service';
import { ResizeObserverService } from 'src/app/shared-module/resize-observer.service';
import { v4 as uuidv4 } from 'uuid';
import { Person, PersonEditable } from '../person';
import { Tag } from 'src/app/shared-module/entry/entry.component';
import { Week } from 'src/app/people-list/week';
import {
  PageComponent,
  SubmissionStatus,
} from 'src/app/shared-module/page/page.component';
import { getNewWeek, getDaysLeft } from '../../shared-module/week-days/week';

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

  constructor(
    private fetchService: FetchService,
    typeaheadService: TypeaheadService,
    resizeObserverService: ResizeObserverService,
    ngZone: NgZone
  ) {
    super(ngZone, resizeObserverService, typeaheadService);
  }

  ngOnInit(): void {
    this.boundGetNameTypeahead = this.getNameTypeAhead.bind(this);
    this.updateFilteredView();
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
    if (!this.status && this.pdmFilter.value === 'All') {
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

  updatePersonDetails(objParam: {
    id: string;
    name: string;
    skill: string;
    comments: string;
    availDate: Date;
    pdm: string;
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
    comments: string;
    availDate: Date;
    pdm: string;
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

  async fetchData(forPDM: boolean = false) {
    setTimeout(() => {
      this.fetching = true;
      this.fetchError = '';
      this.noData = false;
    }, 0);

    const pdm = forPDM ? this.pdmFilter.value : null;
    const submittedOnly = this.displayedIn === 'ALLOCATE';

    try {
      const response = await this.fetchService.fetchWeeklyList(
        this.referenceDate,
        pdm,
        submittedOnly
      );

      const {
        people,
        status,
        lookupTable,
      }: { people: Person[]; status: SubmissionStatus; lookupTable: Person[] } =
        response;

      this.dataSet = this.sortService
        .sortData(people, this.sortService.SORT_COLUMNS.NAME, false, true)
        .map((person) => ({
          ...person,
          inEditMode: false,
        }));

      // lookup table only sent on first fetch, where pdm not provided as parameter
      // if pdm provided as a parameter, he/she cancelled changes and is fetching the old list from server

      if (!forPDM) {
        this.typeaheadService.storeLookupList(
          this.typeaheadService.tableTypes.People,
          lookupTable
        );
      }

      this.status = status;
      this.updateStatusLabel();
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
    const pdmParam =
      this.displayedIn !== 'ALLOCATE' ? this.pdmFilter.value : 'allocator';
    const fetchFullDataOnUpdate =
      this.displayedIn === 'ALLOCATE' ? true : false;

    try {
      await this.fetchService.saveList(
        this.referenceDate,
        pdmParam,
        (this.filteredDataset as any[]).map((person) => {
          const { inEditMode, ...otherProps } = person;

          return {
            ...otherProps,
          };
        })
      );
      await this.fetchData(!fetchFullDataOnUpdate);
    } catch (e: any) {
      this.fetchError = e;
    } finally {
      setTimeout(() => {
        this.uploading = false;
      }, 0);
    }
  }

  onSubmit() {
    this.showSubmitModal = true;
  }

  async handleModalClose(submit: boolean) {
    this.showSubmitModal = false;
    if (submit) {
      this.uploading = true;

      try {
        await this.fetchService.submitList(
          this.referenceDate,
          this.pdmFilter.value,
          (this.filteredDataset as any[]).map((person) => {
            const { inEditMode, ...otherProps } = person;

            return {
              ...otherProps,
            };
          })
        );
        await this.fetchData(true);
      } catch (e: any) {
        this.fetchError = e;
      } finally {
        this.uploading = false;
      }
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
