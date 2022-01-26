import { Injectable } from '@angular/core';
import { timeStamp } from 'console';
import { Person } from 'src/app/people-list/person';
import { Tag } from 'src/app/shared-module/entry/entry.component';
import { getAvailableTags } from 'src/app/utils/getTagsFromData';

enum TableTypes {
  People,
}

enum Fields {
  Name,
  Tag,
}

@Injectable({
  providedIn: 'root',
})
export class TypeaheadService {
  _peopleList!: Person[];
  _tagList!: Tag[];

  tableTypes = TableTypes;
  fields = Fields;

  storeLookupList(type: TableTypes, list: any): void {
    if (type === TableTypes.People) {
      this._peopleList = list as Person[];

      // TO CHANGE - FETCH TAGS SEPARATELY FROM SERVER
      const tags = this._peopleList
        .map((person) => person.tags)
        .filter((tags) => tags.length > 0)
        .map((tags) => tags.map((tag) => JSON.stringify(tag)))
        .flat();
    }
  }

  getTypeahead(field: Fields, dataSet?: any[]): string[] {
    if (field === Fields.Name) {
      return this._getNameTypeahead(dataSet);
    }
    if (field === Fields.Tag) {
      return this._getTagTypeahead(dataSet);
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

  constructor() {
    this._tagList = getAvailableTags();
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
