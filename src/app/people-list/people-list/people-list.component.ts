import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { PEOPLE } from '../people';
import { Person, Tag } from '../person';
import {
  Week,
  getNewWeek,
  getDaysLeft,
} from '../../shared-module/week-days/week';

const SKILL_INDEX = {
  AP: 6,
  EM: 5,
  ASC: 4,
  FELL: 3,
  BA: 2,
  INT: 1,
};

interface Filter {
  field: string;
  value?: string;
}

interface PersonEditable extends Person {
  inEditMode: boolean;
}

@Component({
  selector: 'people-list',
  templateUrl: './people-list.component.html',
  styleUrls: ['./people-list.component.scss'],
})
export class PeopleListComponent implements OnInit {
  people = PEOPLE.map((person) => ({
    ...person,
    inEditMode: false,
  }));
  newRows: Person[] = [];
  sort: { field: string; order: number } = {
    field: '',
    order: 0,
  };
  filters: Filter[] = [];

  inEditMode = false;
  showAvailableOnly = false;
  peopleFilteredView = this.people;
  skillFilter = new FormControl('All');
  showSubmitModal = false;

  // *****************
  // FILTER HANDLERS
  // *****************
  // applyFilters();

  updateFilteredView(): void {
    this.peopleFilteredView = this.filterPeopleView(this.people);
  }

  filterPeopleView(people: PersonEditable[]): PersonEditable[] {
    if (!this.filters.length) {
      return people;
    }
    return this.people.filter((person) => {
      let daysLeftPass = true;
      let skillPass = true;

      for (let filter of this.filters) {
        if (filter.field === 'days') {
          daysLeftPass = person.daysLeft > 0;
        }
        if (filter.field === 'skill') {
          skillPass = person.skill === filter.value;
        }
      }

      return daysLeftPass && skillPass;
    });
  }

  clearFilters(): void {
    this.filters = [];
    this.showAvailableOnly = false;
    this.skillFilter.setValue('All');
    this.updateFilteredView();
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

  updateSkillFilter(event: any): void {
    const skill = event.target.value;

    this.filters = this.filters.filter(
      (filter: Filter) => filter.field !== 'skill'
    );

    if (skill !== 'All') {
      this.filters.push({
        field: 'skill',
        value: skill,
      });
    }

    this.updateFilteredView();
  }

  getClearFilterBtnClass(): string {
    const baseClass = 'bi bi-x-circle-fill fs-12';
    const otherClasses = [];
    if (this.filters.length) {
      otherClasses.push(' clickable');
    } else {
      otherClasses.push(' btn-inactive');
      otherClasses.push('btn-greyed-out');
    }

    const otherClsStr = otherClasses.join(' ');
    return `${baseClass}${otherClsStr}`;
  }

  // *****************
  // EDIT HANDLERS
  // *****************

  setInEditMode(inEditMode: boolean): void {
    this.inEditMode = inEditMode;
    if (!inEditMode) {
      this.newRows = [];
    }
  }

  cancelChanges(): void {
    this.people = this.people.map((person) => ({
      ...person,
      inEditMode: false,
    }));

    this.setInEditMode(false);
    this.updateFilteredView();
  }

  addNewRow(): void {
    this.newRows.push({
      name: '',
      skill: '',
      week: getNewWeek(),
      daysLeft: 5,
      comments: '',
      tags: [],
    });
  }

  removeRow(idx: number): void {
    this.newRows = this.newRows.filter((item, index) => index !== idx);
  }

  editRow(idx: number): void {
    const personObj: PersonEditable = this.peopleFilteredView[idx];
    const mainIdx = this.people.findIndex((person) => person === personObj);
    console.log({
      idx,
      mainIdx,
      personObj,
      peopleArr: this.people,
      filteredArr: this.peopleFilteredView,
    });
    this.people[mainIdx] = {
      ...this.people[mainIdx],
      inEditMode: true,
    };
    this.updateFilteredView();
  }

  removeExistingRow(idx: number): void {
    const personObj: PersonEditable = this.peopleFilteredView[idx];
    const mainIdx = this.people.findIndex((person) => person === personObj);
    this.people = this.people.filter((item, index) => index !== mainIdx);
    this.updateFilteredView();
  }

  updateCalendar(objParam: { calendarObj: Week; idx: number }): void {
    const { calendarObj, idx } = objParam;
    const personObj: PersonEditable = this.peopleFilteredView[idx];

    this.people = this.people.map((person) => {
      if (person !== personObj) {
        return person;
      }
      return {
        ...person,
        week: {
          ...calendarObj,
        },
        daysLeft: getDaysLeft(calendarObj),
      };
    });
    this.updateFilteredView();
  }

  updatePersonDetails(objParam: {
    name: string;
    skill: string;
    comments: string;
    availDate: Date;
    pdm: string;
    idx: number;
    week: Week;
    tags: Tag[];
  }) {
    const { name, skill, comments, idx, availDate, pdm, week, tags } = objParam;
    const personObj: PersonEditable = this.peopleFilteredView[idx];

    this.people = this.people.map((person) => {
      if (person !== personObj) {
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
    this.updateFilteredView();
  }

  addPerson(objParam: {
    name: string;
    skill: string;
    comments: string;
    availDate: Date;
    pdm: string;
    idx: number;
    week: Week;
    tags: Tag[];
  }) {
    this.clearSort();
    const { name, skill, comments, idx, week, tags, availDate, pdm } = objParam;

    this.people.unshift({
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

    this.newRows.splice(idx, 1);
    this.updateFilteredView();
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

  constructor() {}

  ngOnInit(): void {
    this.peopleFilteredView = this.filterPeopleView(this.people);
  }
}
