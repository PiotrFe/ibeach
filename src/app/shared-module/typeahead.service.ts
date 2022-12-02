import { Injectable } from '@angular/core';
import { Person } from 'src/app/people-list/person';
import { Project } from '../project-list/project-list/project';
import { Tag } from 'src/app/shared-module/entry/entry.component';
import { getAvailableTags } from 'src/app/utils/getTagsFromData';
import { ProjectLookupEntry } from '../utils/StorageManager';
import { DataStoreService } from 'src/app/shared-module/data-store.service';
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
  _tagList!: Tag[];

  tableTypes = TableTypes;
  fields = Fields;

  constructor(private dataStoreService: DataStoreService) {
    this._tagList = getAvailableTags();
  }

  get clientTypeahead(): string[] {
    return this.dataStoreService.clientTypeahead;
  }

  get leadershipTypeahead(): string[] {
    return this.dataStoreService.leadershipTypeahead;
  }

  getTypeahead(field: Fields, dataSet?: any): string[] {
    if (field === Fields.Name) {
      return this._getNameTypeahead(dataSet);
    }
    if (field === Fields.Tag) {
      return this._getTagTypeahead(dataSet);
    }

    if (field === Fields.Stats) {
      return this._getStatsTypeahead();
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
    return this.dataStoreService.peopleTypeahead.find(
      (person) => person.name === name
    );
  }

  _getNameTypeahead(dataSet?: any[]): string[] {
    const retVal = !this.dataStoreService.peopleTypeahead
      ? []
      : this.dataStoreService.peopleTypeahead
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

  _getStatsTypeahead(): string[] {
    return [];
  }
}

export class TypeaheadServiceMock extends TypeaheadService {
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
}
