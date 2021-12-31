import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { FetchService } from '../../shared-module/fetch.service';
import { TypeaheadService } from '../../shared-module/typeahead.service';
import { v4 as uuidv4 } from 'uuid';
import { getNewAvailDate, getTagArr, sortTags } from '../../utils/';
import { Person, PersonEditable, PersonEntry, Tag } from '../person';
import {
  PageComponent,
  SubmissionStatus,
  Filter,
  SKILL_INDEX,
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
  people!: PersonEditable[];
  newRows: PersonEditable[] = [];
  inEditMode: boolean = false;
  saveChangesInProgress: boolean = false;
  showAvailableOnly: boolean = false;
  peopleFilteredView = this.people;
  pdmFilter = new FormControl('All');
  referenceDate: Date = new Date();
  showSubmitModal: boolean = false;
  status!: SubmissionStatus;
  statusLabel!: string;
  boundGetNameTypeahead!: Function;

  constructor(
    private fetchService: FetchService,
    private typeaheadService: TypeaheadService
  ) {
    super();
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

  async fetchData() {
    this.fetching = true;
    this.fetchError = '';
    this.noData = false;

    try {
      const response = await this.fetchService.fetchWeeklyList(
        this.referenceDate
      );

      const {
        people,
        status,
        lookupTable,
      }: { people: Person[]; status: SubmissionStatus; lookupTable: Person[] } =
        response;

      this.people = people
        .sort((a: Person, b: Person) => {
          const nameA = a.name.toUpperCase();
          const nameB = b.name.toUpperCase();

          if (nameA < nameB) {
            return -1;
          }
          if (nameA > nameB) {
            return 1;
          }
          return 0;
        })
        .map((person) => ({
          ...person,
          inEditMode: false,
        }));

      this.typeaheadService.storeLookupList(
        this.typeaheadService.tableTypes.People,
        lookupTable
      );
      this.status = status;
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
      this.updateStatusLabel(pdm);
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

  updateStatusLabel(pdm: string) {
    if (!this.status) {
      return;
    }

    try {
      Object.entries(this.status).forEach(
        ([status, pdmArr]: [string, string[]]) => {
          if (pdmArr.includes(pdm)) {
            this.statusLabel = status;
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

  async postChanges() {
    this.uploading = true;
    try {
      await this.fetchService.saveList(
        this.referenceDate,
        this.pdmFilter.value,
        this.people.map((person) => {
          const { inEditMode, ...otherProps } = person;

          return {
            ...otherProps,
          };
        })
      );
    } catch (e: any) {
      this.fetchError = e;
    } finally {
      this.uploading = false;
    }
  }

  checkIfAnyFormsOpen = (): boolean => {
    const atLeastOneFormOpen =
      this.people.find((person: PersonEditable) => person.inEditMode) ||
      this.newRows.length > 0;

    return Boolean(atLeastOneFormOpen);
  };

  onChangeSaved(): void {
    if (this.saveChangesInProgress && !this.checkIfAnyFormsOpen()) {
      setTimeout(() => {
        this.saveChangesInProgress = false;
        this.setInEditMode(false);
      });
    }

    this.updateFilteredView();
  }

  cancelChanges(): void {
    this.people = this.people.map((person: PersonEditable) => ({
      ...person,
      inEditMode: false,
    }));

    this.setInEditMode(false);
    this.updateFilteredView();
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
    this.clearSort();
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
  // SORT HANDLERS
  // *****************

  clearSort() {
    this.sort.field = '';
    this.sort.order = 0;
  }

  getSort(colName: string, order: number): boolean {
    if (this.sort.field === colName) {
      return this.sort.order === order;
    }
    return false;
  }

  updateSortIcon(colName: string): void {
    if (this.sort.field === colName) {
      if (this.sort.order === 0) {
        this.sort.order = 1;
      } else if (this.sort.order === 1) {
        this.sort.order = -1;
      } else if (this.sort.order === -1) {
        this.sort.order = 1;
      }
    } else {
      this.sort.field = colName;
      this.sort.order = ['skill', 'days'].includes(colName) ? -1 : 1;
    }
  }

  sortValsByName = (
    a: PersonEditable,
    b: PersonEditable,
    asc: boolean = false
  ): number => {
    const order = this.sort.order;

    const nameA = a.name.toUpperCase();
    const nameB = b.name.toUpperCase();

    if (nameA < nameB) {
      return asc ? -1 : order * -1;
    }
    if (nameA > nameB) {
      return asc ? 1 : order;
    }

    return 0;
  };

  sortValsByDays = (
    a: PersonEditable,
    b: PersonEditable,
    asc: boolean = false
  ): number => {
    const order = this.sort.order;
    const daysA = a.daysLeft;
    const daysB = b.daysLeft;

    if (daysA < daysB) {
      return asc ? -1 : order * -1;
    }
    if (daysA > daysB) {
      return asc ? 1 : order;
    }

    return 0;
  };

  sortValsBySkill = (
    a: PersonEditable,
    b: PersonEditable,
    asc: boolean = false
  ): number => {
    const order = this.sort.order;
    const skillA = a.skill;
    const skillB = b.skill;

    if (
      SKILL_INDEX[skillA as keyof typeof SKILL_INDEX] <
      SKILL_INDEX[skillB as keyof typeof SKILL_INDEX]
    ) {
      return asc ? -1 : order * -1;
    }
    if (
      SKILL_INDEX[skillA as keyof typeof SKILL_INDEX] >
      SKILL_INDEX[skillB as keyof typeof SKILL_INDEX]
    ) {
      return asc ? 1 : order;
    }

    return 0;
  };

  sortValsByDate = (
    a: PersonEditable,
    b: PersonEditable,
    asc: boolean = false
  ): number => {
    if (!a.availDate || !b.availDate) {
      return 0;
    }

    const order = this.sort.order;
    const dateA = a.availDate.getTime();
    const dateB = b.availDate.getTime();

    if (dateA < dateB) {
      return asc ? -1 : order * -1;
    }
    if (dateA > dateB) {
      return asc ? 1 : order;
    }

    return 0;
  };

  sortValsByPDM = (
    a: PersonEditable,
    b: PersonEditable,
    asc: boolean = false
  ): number => {
    if (!a.pdm || !b.pdm) {
      return 0;
    }
    const order = this.sort.order;

    const nameA = a.pdm.toUpperCase();
    const nameB = b.pdm.toUpperCase();

    if (nameA < nameB) {
      return asc ? -1 : order * -1;
    }
    if (nameA > nameB) {
      return asc ? 1 : order;
    }

    return 0;
  };

  handleSort = (colName: string): void => {
    this.updateSortIcon(colName);
    const order = this.sort.order;
    const sortValsBySkill = this.sortValsBySkill;
    const sortValsByName = this.sortValsByName;
    const sortValsByDays = this.sortValsByDays;
    const sortValsByDate = this.sortValsByDate;
    const sortValsByPDM = this.sortValsByPDM;

    if (colName === 'name') {
      this.people.sort(function (a, b) {
        return sortValsByName(a, b);
      });
    }

    if (colName === 'skill') {
      this.people.sort(function (a, b) {
        // (1) sort by skill
        let returnVal: number = sortValsBySkill(a, b);

        if (returnVal !== 0) {
          return returnVal;
        }
        // (2) sort by days (asc)
        returnVal = sortValsByDays(a, b, true);

        if (returnVal !== 0) {
          return returnVal;
        }

        // (3) sort by name (asc)
        return sortValsByName(a, b, true);
      });
    }

    if (colName === 'days') {
      this.people.sort(function (a, b) {
        // (1) sort by days
        let returnVal: number = sortValsByDays(a, b);

        if (returnVal !== 0) {
          return returnVal;
        }

        // (2) sort by name (skill)
        returnVal = sortValsBySkill(a, b, true);

        if (returnVal !== 0) {
          return returnVal;
        }

        // (3) sort by name (asc)
        return sortValsByName(a, b, true);
      });
    }
    if (colName === 'availDate') {
      this.people.sort(function (a, b) {
        let returnVal: number = sortValsByDate(a, b);

        if (returnVal !== 0) {
          return returnVal;
        }
        // (2) sort by name (skill)
        returnVal = sortValsBySkill(a, b, true);

        if (returnVal !== 0) {
          return returnVal;
        }
        // (3) sort by name (asc)
        return sortValsByName(a, b, true);
      });
    }

    if (colName === 'pdm') {
      this.people.sort(function (a, b) {
        let returnVal: number = sortValsByPDM(a, b);

        if (returnVal !== 0) {
          return returnVal;
        }
        return sortValsBySkill(a, b, true);
      });
    }
    this.updateFilteredView();
  };

  // *****************
  // SUBMIT HANDLERS
  // *****************
  onSubmit() {
    this.showSubmitModal = true;
  }
  handleModalClose(submit: boolean) {
    this.showSubmitModal = false;
    if (submit) {
      alert('List has been submitted');
    }
  }
}
