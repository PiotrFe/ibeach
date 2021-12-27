import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Week } from './week';
import { PEOPLE } from './people';
import { getTagArr } from '../utils/';
import { PAGE_SECTIONS } from '../app.component';

export const SKILLS = ['EM', 'ASC', 'FELL', 'BA', 'INT'];

export interface Tag {
  type: string;
  value: string;
}

export interface Person {
  name: string;
  skill: string;
  pdm?: string;
  availDate?: Date;
  week: Week;
  daysLeft: number;
  comments?: string;
  tags: Tag[];
}

export interface PersonEditable extends Person {
  id: string;
  inEditMode: boolean;
}

@Component({
  template: '',
})
export class PersonEntry {
  @Input() id!: string;
  @Input() person!: Person;
  @Input() sortField!: string;
  @Input() currPageSection!: keyof typeof PAGE_SECTIONS;

  @Output() deleteEvent = new EventEmitter<string>();
  @Output() calendarChangeEvent = new EventEmitter<{
    id: string;
    calendarObj: Week;
  }>();

  tagInput = new FormControl('');
  showAddTag: boolean = false;

  getTypeAhead(key: string): any[] {
    if (key === 'pdm') {
      return this.getPDMTypeAhead(key);
    }
    if (key === 'tag') {
      const arr = this.getTagTypeAhead();
      console.log({ arr });
      return arr;
    }

    return [];
  }

  getPDMTypeAhead(key: string): any[] {
    return PEOPLE.map((item) => item[key as keyof Person]);
  }
  getTagTypeAhead(): any[] {
    const tagArr = getTagArr().map((item) => item.value);
    const currTags = this.person
      ? this.person.tags.map((tag) => tag.value)
      : [];

    if (!currTags.length) {
      return tagArr;
    }

    const filtered = tagArr.filter((tag) => !currTags.includes(tag));

    return filtered;
  }

  setShowAddTag(show: boolean): void {
    this.showAddTag = show;
  }
}
