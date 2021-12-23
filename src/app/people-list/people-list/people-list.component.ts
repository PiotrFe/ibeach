import { Component, OnInit } from '@angular/core';
import { PEOPLE } from '../people';
import { Person } from '../person';
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
  inEditMode = false;
  showAvailableOnly = false;
  newRows: Person[] = [];
  sort: { field: string; order: number } = {
    field: '',
    order: 0,
  };
  filters: Filter[] = [];

  peopleFilteredView = this.people;

  // *****************
  // FILTER HANDLERS
  // *****************
  // applyFilters();

  filterPeopleView(people: PersonEditable[]): PersonEditable[] {
    if (!this.filters.length) {
      return people;
    }
    return this.people.filter((person) => {
      let returnPerson = true;

      for (let filter of this.filters) {
        if (filter.field === 'days') {
          returnPerson = person.daysLeft > 0;
        }
      }

      return returnPerson;
    });
  }

  toggleShowAvailableOnly() {
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

  updateFilteredView(): void {
    this.peopleFilteredView = this.filterPeopleView(this.people);
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

  addNewRow(): void {
    this.newRows.push({
      name: '',
      skill: '',
      week: getNewWeek(),
      daysLeft: 5,
      comments: '',
    });
  }

  removeRow(idx: number): void {
    this.newRows = this.newRows.filter((item, index) => index !== idx);
  }

  editRow(idx: number): void {
    this.people[idx] = {
      ...this.people[idx],
      inEditMode: true,
    };
    this.updateFilteredView();
  }

  removeExistingRow(idx: number): void {
    this.people = this.people.filter((item, index) => index !== idx);
    this.peopleFilteredView = this.filterPeopleView(this.people);
  }

  updateCalendar(objParam: { calendarObj: Week; idx: number }): void {
    const { calendarObj, idx } = objParam;

    this.people = this.people.map((person, index) => {
      if (index !== idx) {
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
    idx: number;
  }) {
    const { name, skill, comments, idx } = objParam;
    this.people = this.people.map((person, index) => {
      if (index !== idx) {
        return person;
      }
      return {
        ...person,
        name,
        skill,
        comments,
        inEditMode: false,
      };
    });
    this.updateFilteredView();
  }

  addPerson(objParam: {
    name: string;
    skill: string;
    comments: string;
    idx: number;
    week: Week;
  }) {
    this.clearSort();
    const { name, skill, comments, idx, week } = objParam;

    this.people.unshift({
      name,
      skill,
      week,
      comments,
      inEditMode: false,
      daysLeft: getDaysLeft(week),
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
      this.sort.order = 1;
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
      return asc ? 1 : order;
    }
    if (daysA > daysB) {
      return asc ? -1 : order * -1;
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
      return asc ? 1 : order;
    }
    if (
      SKILL_INDEX[skillA as keyof typeof SKILL_INDEX] >
      SKILL_INDEX[skillB as keyof typeof SKILL_INDEX]
    ) {
      return asc ? -1 : order * -1;
    }

    return 0;
  };

  handleSort = (colName: string): void => {
    this.updateSortIcon(colName);
    const order = this.sort.order;
    const sortValsBySkill = this.sortValsBySkill;
    const sortValsByName = this.sortValsByName;
    const sortValsByDays = this.sortValsByDays;

    if (colName === 'name') {
      this.people.sort(function (a, b) {
        return sortValsBySkill(a, b);
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

        // (3) sort by name (skill)
        returnVal = sortValsBySkill(a, b, true);

        if (returnVal !== 0) {
          return returnVal;
        }

        // (3) sort by name (asc)
        return sortValsByName(a, b, true);
      });
    }
    this.updateFilteredView();
  };

  constructor() {}

  ngOnInit(): void {
    this.peopleFilteredView = this.filterPeopleView(this.people);
  }
}
