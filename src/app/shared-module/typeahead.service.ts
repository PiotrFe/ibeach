import { Injectable } from '@angular/core';
import { timeStamp } from 'console';
import { Person } from 'src/app/people-list/person';
import { Tag } from 'src/app/shared-module/entry/entry.component';

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

      this._tagList = Array.from(new Set(tags)).map((tag) => JSON.parse(tag));
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

  constructor() {}
}
