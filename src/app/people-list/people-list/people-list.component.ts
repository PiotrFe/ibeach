import { Component, OnInit, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { FetchService } from '../../shared-module/fetch.service';
import { TypeaheadService } from '../../shared-module/typeahead.service';
import { SortService } from 'src/app/shared-module/sort.service';
import { v4 as uuidv4 } from 'uuid';
import { getNewAvailDate, sortTags } from '../../utils/';
import { Person, PersonEditable, Tag } from '../person';
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

@Component({
  selector: 'people-list',
  templateUrl: './people-list.component.html',
  styleUrls: ['./people-list.component.scss'],
})
export class PeopleListComponent extends PageComponent implements OnInit {
  @Input() displayedIn!: 'SUBMIT' | 'ALLOCATE';

  people!: PersonEditable[];
  newRows: PersonEditable[] = [];
  inEditMode: boolean = false;
  saveChangesInProgress: boolean = false;
  showAvailableOnly: boolean = false;
  peopleFilteredView = this.people;
  pdmFilter = new FormControl('All');
  skillFilter = new FormControl('All');
  referenceDate: Date = new Date();
  showSubmitModal: boolean = false;
  status!: SubmissionStatus;
  statusLabel!: string;
  submitted!: boolean;
  boundGetNameTypeahead!: Function;
  sortService!: SortService;

  constructor(
    private fetchService: FetchService,
    private typeaheadService: TypeaheadService,
    sortService: SortService
  ) {
    super();
    this.sortService = sortService;
  }

  ngOnInit(): void {
    this.boundGetNameTypeahead = this.getNameTypeAhead.bind(this);
    this.updateFilteredView();
  }

  onDateChange(date: Date) {
    this.referenceDate = date;
    this.referenceDate.setHours(0, 0, 0, 0);
    this.people = [];
    this.fetchData();
    setTimeout(() => {
      this.updateFilteredView();
    }, 0);
  }

  handleSort(colName: string) {
    this.people = this.sortService.sortData(this.people, colName);
    this.updateFilteredView();
  }

  // *****************
  // FILTER HANDLERS
  // *****************

  updateFilteredView(): void {
    this.peopleFilteredView = this.getFilteredView(this.people);
  }

  getPDMList(): string[] {
    if (!this.status) {
      return [];
    }

    return Object.values(this.status)
      .reduce((arr, subArr) => (arr = [...arr, ...subArr]), [])
      .sort();
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

  getNameTypeAhead(): string[] {
    return this.typeaheadService.getTypeahead(
      this.typeaheadService.fields.Name,
      this.people
    );
  }

  setInEditMode(inEditMode: boolean): void {
    this.inEditMode = inEditMode;
    if (!inEditMode) {
      this.newRows = [];
    }
  }
  saveChanges(): void {
    this.people = this.people.map((person: PersonEditable) => ({
      ...person,
      inEditMode: false,
    }));

    if (!this.checkIfAnyFormsOpen()) {
      this.setInEditMode(false);
      this.updateFilteredView();
      this.postChanges();
      return;
    }

    this.saveChangesInProgress = true;
  }

  checkIfAnyFormsOpen = (): boolean => {
    const atLeastOneFormOpen =
      this.people.find((person: PersonEditable) => person.inEditMode) ||
      this.newRows.length > 0;

    return Boolean(atLeastOneFormOpen);
  };

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
    this.people = this.people.map((person: PersonEditable) => ({
      ...person,
      inEditMode: false,
    }));

    this.fetchData(true);
    this.setInEditMode(false);
  }

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
    });
  }

  removeRow(id: string): void {
    this.newRows = this.newRows.filter((item) => item.id !== id);
  }

  editRow(id: string): void {
    const idx = this.people.findIndex((person) => person.id === id);
    this.people[idx] = {
      ...this.people[idx],
      inEditMode: true,
    };
    this.updateFilteredView();
  }

  removeExistingRow(id: string): void {
    this.people = this.people.filter((person) => person.id !== id);
    this.updateFilteredView();
  }

  updateCalendar(objParam: { id: string; calendarObj: Week }): void {
    const { calendarObj, id } = objParam;
    const newAvailDate = getNewAvailDate(calendarObj, this.referenceDate);

    this.people = this.people.map((person) => {
      if (person.id !== id) {
        return person;
      }
      return {
        ...person,
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

    const personIdx: number | undefined = this.people.findIndex(
      (person) => person.id === id
    );

    if (typeof personIdx === undefined) {
      return;
    }

    const person = this.people[personIdx];
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

    this.people[personIdx] = {
      ...person,
      tags: sortTags(tags),
    };

    this.onChangeSaved();
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

    this.people = this.people.map((person) => {
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

    this.people.unshift({
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

    try {
      const response = await this.fetchService.fetchWeeklyList(
        this.referenceDate,
        pdm
      );

      const {
        people,
        status,
        lookupTable,
      }: { people: Person[]; status: SubmissionStatus; lookupTable: Person[] } =
        response;

      this.people = this.sortService
        .sortData(people, this.sortService.SORT_COLUMNS.NAME, false)
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

    try {
      await this.fetchService.saveList(
        this.referenceDate,
        this.pdmFilter.value,
        this.peopleFilteredView.map((person) => {
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
          this.peopleFilteredView.map((person) => {
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
}
