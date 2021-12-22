import { Component, OnInit } from '@angular/core';
import { PEOPLE } from '../people';
import { Person } from '../person';
import { Week, getNewWeek } from '../../shared-module/week-days/week';

@Component({
  selector: 'people-list',
  templateUrl: './people-list.component.html',
  styleUrls: ['./people-list.component.scss'],
})
export class PeopleListComponent implements OnInit {
  people = PEOPLE.map((item) => ({ ...item, inEditMode: false }));
  inEditMode = false;
  newRows: Person[] = [];
  sort: { field: string; order: number } = {
    field: '',
    order: 0,
  };

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
  }

  removeExistingRow(idx: number): void {
    this.people = this.people.filter((item, index) => index !== idx);
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
      };
    });
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
  }

  addPerson(objParam: {
    name: string;
    skill: string;
    comments: string;
    idx: number;
    week: Week;
  }) {
    const { name, skill, comments, idx, week } = objParam;

    this.people.unshift({
      name,
      skill,
      week,
      comments,
      inEditMode: false,
    });

    this.newRows.splice(idx, 1);
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
        this.sort.order = 0;
      }
    } else {
      this.sort.field = colName;
      this.sort.order = 1;
    }
  }

  handleSort(colName: string): void {
    this.updateSortIcon(colName);

    if (colName === 'name') {
      const order = this.sort.order;

      this.people.sort(function (a, b) {
        const nameA = a.name.toUpperCase();
        const nameB = b.name.toUpperCase();

        if (nameA < nameB) {
          return order * -1;
        }
        if (nameA > nameB) {
          return order;
        }

        return 0;
      });
    }
  }

  constructor() {}

  ngOnInit(): void {}
}
