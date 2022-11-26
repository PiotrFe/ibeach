import { Injectable } from '@angular/core';
import { Person } from 'src/app/people-list/person';
import { Project } from '../project-list/project-list/project';
import { Tag } from 'src/app/shared-module/entry/entry.component';
import { getAvailableTags } from 'src/app/utils/getTagsFromData';
import { ProjectLookupEntry } from '../utils/StorageManager';
import { cleanString, lCaseCompareFn } from '../utils';

enum TableTypes {
  People,
  Projects,
}

enum Fields {
  Client,
  Name,
  Leadership,
  Tag,
  Stats,
}

@Injectable({
  providedIn: 'root',
})
export class TypeaheadService {
  _peopleList!: Person[];
  _projectList!: ProjectLookupEntry;
  _tagList!: Tag[];

  tableTypes = TableTypes;
  fields = Fields;

  constructor() {
    this._tagList = getAvailableTags();
  }

  storeLookupList(type: TableTypes, list: any): void {
    if (type === TableTypes.People) {
      this._peopleList = list as Person[];
    }

    if (type === TableTypes.Projects) {
      this._projectList = list as ProjectLookupEntry;
    }
  }

  getTypeahead(field: Fields, dataSet?: any[]): string[] {
    if (field === Fields.Name) {
      return this._getNameTypeahead(dataSet);
    }
    if (field === Fields.Tag) {
      return this._getTagTypeahead(dataSet);
    }

    if (field === Fields.Client) {
      return this._getClientTypeahead(dataSet);
    }

    if (field === Fields.Leadership) {
      return this._getLeaderTypeahead(dataSet);
    }

    if (field === Fields.Stats) {
      return this._getStatsTypeahead(dataSet);
    }

    return [];
  }

  checkIfTagLegal(val: string): boolean {
    return this._tagList.map((tag) => tag.value).includes(val);
  }

  getTagByVal(val: string): Tag | undefined {
    return this._tagList.find((tag) => tag.value === val);
  }

  getPersonByName(name: string): Person | undefined {
    return this._peopleList.find((person) => person.name === name);
  }

  _getNameTypeahead(dataSet?: any[]): string[] {
    const retVal = !this._peopleList
      ? []
      : this._peopleList
          .filter((person: Person) => {
            if (!dataSet) {
              return person;
            }
            const idx = dataSet.findIndex(
              (displayedPerson: Person) => displayedPerson.id === person.id
            );
            return idx < 0;
          })
          .map((person: Person) => person.name);

    return retVal;
  }

  _getClientTypeahead(data?: any[]): string[] {
    const clientsOnPage =
      data?.map((entry) => cleanString(entry?.client)) || [];
    const clientSet = new Set([
      ...(this._projectList?.clients || []),
      ...clientsOnPage,
    ]);
    return [...clientSet].sort(lCaseCompareFn);
  }

  _getLeaderTypeahead(data?: any[]): string[] {
    const leadersOnPage =
      data
        ?.map((entry) =>
          entry?.leadership?.map((leader: any) => cleanString(leader?.name))
        )
        ?.flat() || [];
    const leaderSet = new Set([
      ...(this._projectList?.leadership || []),
      ...leadersOnPage,
    ]);
    return [...leaderSet].sort(lCaseCompareFn);
  }

  _getTagTypeahead(dataSet?: Tag[]): string[] {
    if (dataSet) {
      const currTags = dataSet.map((tag) => tag.value);

      return !this._tagList
        ? []
        : this._tagList
            .filter((tag) => !currTags.includes(tag.value))
            .map((tag) => tag.value);
    }

    return this._tagList.map((tag) => tag.value);
  }

  _getStatsTypeahead(data: any): string[] {
    return [];
  }
}

export class TypeaheadServiceMock extends TypeaheadService {
  override storeLookupList(type: TableTypes, list: any): void {}

  override getTypeahead(field: Fields, dataSet?: any[]): string[] {
    return [];
  }

  override checkIfTagLegal(val: string): boolean {
    return true;
  }

  override getTagByVal(val: string): Tag | undefined {
    return undefined;
  }

  override getPersonByName(name: string): Person | undefined {
    return undefined;
  }

  override _getNameTypeahead(dataSet?: any[]): string[] {
    return [];
  }

  override _getTagTypeahead(dataSet?: Tag[]): string[] {
    return [];
  }

  constructor() {
    super();
  }
}
