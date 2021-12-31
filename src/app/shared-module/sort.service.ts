import { Injectable } from '@angular/core';
import { Person, PersonEditable } from 'src/app/people-list/person';

const SKILL_INDEX = {
  AP: 6,
  EM: 5,
  ASC: 4,
  FELL: 3,
  BA: 2,
  INT: 1,
};

interface SortEntry {
  field: string;
  order: 1 | 0 | -1;
}

@Injectable({
  providedIn: 'root',
})
export class SortService {
  sort: SortEntry = {
    field: '',
    order: 0,
  };

  SORT_COLUMNS = {
    NAME: 'name',
  };

  constructor() {}

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

  updateSortCriteria(colName: string): void {
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

  sortByName = (
    a: Person | PersonEditable,
    b: Person | PersonEditable,
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

  sortByDays = (
    a: Person | PersonEditable,
    b: Person | PersonEditable,
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

  sortBySkill = (
    a: Person | PersonEditable,
    b: Person | PersonEditable,
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

  sortByDate = (
    a: Person | PersonEditable,
    b: Person | PersonEditable,
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

  sortByPDM = (
    a: Person | PersonEditable,
    b: Person | PersonEditable,
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

  sortData = (
    dataSet: any[],
    colName: string,
    showHighlight: boolean = true
  ): any[] => {
    this.updateSortCriteria(colName);
    const sortBySkill = this.sortBySkill;
    const sortByName = this.sortByName;
    const sortByDays = this.sortByDays;
    const sortByDate = this.sortByDate;
    const sortByPDM = this.sortByPDM;

    const sortedDataSet = [...dataSet];

    if (colName === this.SORT_COLUMNS.NAME) {
      sortedDataSet.sort(function (a, b) {
        return sortByName(a, b);
      });
    }

    if (colName === 'skill') {
      sortedDataSet.sort(function (a, b) {
        // (1) sort by skill
        let returnVal: number = sortBySkill(a, b);

        if (returnVal !== 0) {
          return returnVal;
        }
        // (2) sort by days (asc)
        returnVal = sortByDays(a, b, true);

        if (returnVal !== 0) {
          return returnVal;
        }

        // (3) sort by name (asc)
        return sortByName(a, b, true);
      });
    }

    if (colName === 'days') {
      sortedDataSet.sort(function (a, b) {
        // (1) sort by days
        let returnVal: number = sortByDays(a, b);

        if (returnVal !== 0) {
          return returnVal;
        }

        // (2) sort by name (skill)
        returnVal = sortBySkill(a, b, true);

        if (returnVal !== 0) {
          return returnVal;
        }

        // (3) sort by name (asc)
        return sortByName(a, b, true);
      });
    }
    if (colName === 'availDate') {
      sortedDataSet.sort(function (a, b) {
        let returnVal: number = sortByDate(a, b);

        if (returnVal !== 0) {
          return returnVal;
        }
        // (2) sort by name (skill)
        returnVal = sortBySkill(a, b, true);

        if (returnVal !== 0) {
          return returnVal;
        }
        // (3) sort by name (asc)
        return sortByName(a, b, true);
      });
    }

    if (colName === 'pdm') {
      sortedDataSet.sort(function (a, b) {
        let returnVal: number = sortByPDM(a, b);

        if (returnVal !== 0) {
          return returnVal;
        }
        return sortBySkill(a, b, true);
      });
    }

    if (!showHighlight) {
      this.clearSort();
    }

    return sortedDataSet;
  };
}
