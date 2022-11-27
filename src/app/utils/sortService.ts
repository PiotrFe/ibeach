import { Person, PersonEditable } from 'src/app/people-list/person';
import { Project, ProjectEditable } from '../project-list/project-list/project';
import { StatsEntry } from 'src/app/stats/stats-entry/stats-entry.component';
import { Tag } from 'src/app/shared-module/entry/entry.component';

const SKILL_INDEX = {
  AP: 6,
  EM: 5,
  PSSM: 4.9,
  EDS: 4.8,
  SRAS: 4.5,
  ASC: 4,
  PSSA: 3.6,
  SFDS: 3.5,
  FELL: 3,
  BA: 2.2,
  PSSR: 2,
  SA: 1.1,
  INT: 1,
  ECAI: 0.9,
};

const PROJECT_INDEX = {
  LOP: 6,
  WS: 5,
  MT: 4,
  PD: 3,
  OTH: 2,
};

interface SortEntry {
  field: string;
  order: 1 | 0 | -1;
}

function isPerson(entry: any): entry is Person {
  return entry.name !== undefined && entry.skill !== undefined;
}

function isPersonEditable(entry: any): entry is PersonEditable {
  return (
    entry.name !== undefined &&
    entry.skill !== undefined &&
    entry.isEditable !== undefined
  );
}

function isProject(entry: any): entry is Project {
  return entry.client !== undefined;
}

function isProjectEditable(entry: any): entry is ProjectEditable {
  return (
    entry.client !== undefined &&
    entry.type !== undefined &&
    entry.isEditable !== undefined
  );
}

export class SortService {
  sort: SortEntry = {
    field: '',
    order: 0,
  };

  SORT_COLUMNS = {
    NAME: 'name',
    PROJECT_TYPE: 'type',
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
      this.sort.order = [
        'skill',
        'days',
        'type',
        'asked',
        'got',
        'ratio',
      ].includes(colName)
        ? -1
        : 1;
    }
  }

  sortByName = (
    a: Person | PersonEditable | Project | ProjectEditable | StatsEntry,
    b: Person | PersonEditable | Project | ProjectEditable | StatsEntry,
    asc: boolean = false
  ): number => {
    const order = this.sort.order;

    let nameA: string = '';
    let nameB: string = '';

    if (
      (isPerson(a) && isPerson(b)) ||
      (isPersonEditable(a) && isPersonEditable(b))
    ) {
      nameA = a.name.toUpperCase();
      nameB = b.name.toUpperCase();
    } else if (
      (isProject(a) && isProject(b)) ||
      (isProjectEditable(a) && isProjectEditable(b))
    ) {
      nameA = a.client.toUpperCase();
      nameB = b.client.toUpperCase();
    }

    if (nameA < nameB) {
      return asc ? -1 : order * -1;
    }
    if (nameA > nameB) {
      return asc ? 1 : order;
    }

    return 0;
  };

  sortByDays = (
    a: Person | PersonEditable | Project | ProjectEditable,
    b: Person | PersonEditable | Project | ProjectEditable,
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

  sortByProjectType = (
    a: Project | ProjectEditable,
    b: Project | ProjectEditable,
    asc: boolean = false
  ): number => {
    const order = this.sort.order;
    const typeA = a.type;
    const typeB = b.type;

    if (
      PROJECT_INDEX[typeA as keyof typeof PROJECT_INDEX] <
      PROJECT_INDEX[typeB as keyof typeof PROJECT_INDEX]
    ) {
      return asc ? -1 : order * -1;
    }
    if (
      PROJECT_INDEX[typeA as keyof typeof PROJECT_INDEX] >
      PROJECT_INDEX[typeB as keyof typeof PROJECT_INDEX]
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

  sortByTags = (
    a: Person | PersonEditable | Project | ProjectEditable,
    b: Person | PersonEditable | Project | ProjectEditable,
    asc: boolean = false
  ): number => {
    const order = this.sort.order;

    if (a.tags[0]?.type === b.tags[0]?.type) {
      if (a.tags[0]?.value < b.tags[0]?.value) {
        return asc ? -1 : order * -1;
      }

      if (a.tags[0]?.value > b.tags[0]?.value) {
        return asc ? 1 : order;
      }

      return 0;
    } else if (a.tags[0]?.type && b.tags[0]?.type) {
      if (a.tags[0].type === 'ind') {
        return -1;
      }
      if (b.tags[0].type === 'ind') {
        return 1;
      }

      return 0;
    } else if (a.tags[0]?.type || b.tags[0]?.type) {
      if (a.tags[0]?.type) {
        return -1;
      }

      return 1;
    }

    return 0;
  };

  sortByStats = (
    a: StatsEntry,
    b: StatsEntry,
    column: 'got' | 'asked' | 'ratio',
    asc: boolean = false
  ): number => {
    const order = this.sort.order;

    let valA;
    let valB;

    if (column === 'got' || column === 'asked') {
      valA = a.days[column];
      valB = b.days[column];
    } else {
      valA = a.days.got / a.days.asked;
      valB = b.days.got / b.days.asked;
    }

    if (valA < valB) {
      return asc ? -1 : order * -1;
    }
    if (valA > valB) {
      return asc ? 1 : order;
    }

    return 0;
  };

  applyCurrentSort = (dataSet: any[]): any[] => {
    if (this.sort.field) {
      return this.sortData(dataSet, this.sort.field, true, false, false);
    }
    return this.sortData(dataSet, 'name', false, true, false);
  };

  sortData = (
    dataSet: any[],
    colName: string,
    showHighlight: boolean = true,
    freshStart: boolean = false,
    updateCriteria: boolean = true
  ): any[] => {
    if (!dataSet?.length) {
      return dataSet;
    }
    if (freshStart) {
      this.clearSort();
      this.updateSortCriteria(colName);
    }

    if (!freshStart && updateCriteria) {
      this.updateSortCriteria(colName);
    }

    const sortBySkill = this.sortBySkill;
    const sortByProjectType = this.sortByProjectType;
    const sortByName = this.sortByName;
    const sortByDays = this.sortByDays;
    const sortByDate = this.sortByDate;
    const sortByPDM = this.sortByPDM;
    const sortByTags = this.sortByTags;
    const sortByStats = this.sortByStats;

    const sortedDataSet = [...dataSet];

    if (colName === this.SORT_COLUMNS.NAME) {
      sortedDataSet.sort(function (a, b) {
        return sortByName(a, b);
      });
    }

    if (colName === 'skill') {
      sortedDataSet.sort(function (a, b) {
        let returnVal: number = sortBySkill(a, b);

        if (returnVal !== 0) {
          return returnVal;
        }

        return sortByName(a, b, true);
      });
    }

    if (colName === this.SORT_COLUMNS.PROJECT_TYPE) {
      sortedDataSet.sort(function (a, b) {
        let returnVal: number = sortByProjectType(a, b);

        if (returnVal !== 0) {
          return returnVal;
        }

        return sortByName(a, b, true);
      });
    }

    if (colName === 'days') {
      sortedDataSet.sort(function (a, b) {
        let returnVal: number = sortByDays(a, b);

        if (returnVal !== 0) {
          return returnVal;
        }
        returnVal = sortBySkill(a, b);

        if (returnVal !== 0) {
          return returnVal;
        }
        return sortByName(a, b, true);
      });
    }
    if (colName === 'availDate') {
      sortedDataSet.sort(function (a, b) {
        let returnVal: number = sortByDate(a, b);

        if (returnVal !== 0) {
          return returnVal;
        }
        returnVal = sortBySkill(a, b);

        if (returnVal !== 0) {
          return returnVal;
        }
        return sortByName(a, b, true);
      });
    }

    if (colName === 'pdm') {
      sortedDataSet.sort(function (a, b) {
        let returnVal: number = sortByPDM(a, b);

        if (returnVal !== 0) {
          return returnVal;
        }
        return sortBySkill(a, b);
      });
    }

    if (colName === 'tags') {
      sortedDataSet.sort(function (a, b) {
        let returnVal: number = sortByTags(a, b);

        if (returnVal !== 0) {
          return returnVal;
        }
        return sortByName(a, b, true);
      });
    }

    if (colName === 'asked' || colName === 'got' || colName === 'ratio') {
      sortedDataSet.sort(function (a, b) {
        let returnVal: number = sortByStats(a, b, colName);

        if (returnVal !== 0) {
          return returnVal;
        }

        return sortByName(a, b, true);
      });
    }

    if (!showHighlight) {
      this.clearSort();
    }

    return sortedDataSet;
  };
}
