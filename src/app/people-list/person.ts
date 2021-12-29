import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { Week } from './week';
import { PEOPLE } from './people';
import { getTagArr, getTagFunction, sortTags } from '../utils/';
import { PAGE_SECTIONS } from '../app.component';

export const SKILLS = ['EM', 'ASC', 'FELL', 'BA', 'INT'];

export interface Tag {
  type: string;
  value: string;
}

export interface Person {
  id: string;
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
  inEditMode: boolean;
}

@Component({
  template: '',
})
export class PersonEntry {
  @ViewChild('addTag') addTagElem!: ElementRef;

  @Input() id!: string;
  @Input() person!: Person;
  @Input() sortField!: string;
  @Input() currPageSection!: keyof typeof PAGE_SECTIONS;

  @Output() deleteEvent = new EventEmitter<string>();
  @Output() calendarChangeEvent = new EventEmitter<{
    id: string;
    calendarObj: Week;
  }>();

  @Output() tagChangeEvent = new EventEmitter<{
    id: string;
    value: string;
    action: 'add' | 'remove';
  }>();

  tags!: Tag[];
  tagInput = new FormControl('');
  showAddTag: boolean = false;
  tagArr: string[] = getTagArr().map((item) => item.value);

  getTypeAhead(key: string, submittedBy: 'form' | 'entry'): any[] {
    if (key === 'pdm') {
      return this.getPDMTypeAhead(key);
    }
    if (key === 'tag') {
      const arr = this.getTagTypeAhead(submittedBy);
      return arr;
    }

    return [];
  }

  getPDMTypeAhead(key: string): any[] {
    return PEOPLE.map((item) => item[key as keyof Person]);
  }
  getTagTypeAhead(submittedBy: 'form' | 'entry'): any[] {
    const currTags =
      submittedBy === 'entry'
        ? this.person.tags.map((tag) => tag.value)
        : this.tags.map((tag) => tag.value);

    if (!currTags.length) {
      return this.tagArr;
    }

    const filtered = this.tagArr.filter((tag) => !currTags.includes(tag));

    return filtered;
  }

  setShowAddTag(show: boolean): void {
    this.showAddTag = show;
    setTimeout(() => {
      this.addTagElem.nativeElement.focus();
    }, 0);
  }

  checkIfTagLegal() {
    return this.tagArr.includes(this.tagInput.value);
  }

  onTagSubmit(submittedBy: 'form' | 'entry'): void {
    const tagLegal: boolean = this.checkIfTagLegal();

    if (tagLegal) {
      if (submittedBy === 'entry') {
        this.tagChangeEvent.emit({
          id: this.id,
          value: this.tagInput.value,
          action: 'add',
        });
      } else {
        this.tags = sortTags([
          ...this.tags,
          {
            value: this.tagInput.value,
            type: getTagFunction(this.tagInput.value),
          },
        ]);
      }
    }

    this.tagInput.setValue('');
    this.showAddTag = false;
  }

  onTagDelete(value: string, submittedBy: 'form' | 'entry'): void {
    if (submittedBy === 'entry') {
      this.tagChangeEvent.emit({
        id: this.id,
        value,
        action: 'remove',
      });
    } else {
      this.tags = this.tags.filter((tag) => tag.value !== value);
    }
  }

  getFieldClasses(fieldName: string): string {
    const baseClass = `section section-${fieldName} mr-12 flex flex-ver-ctr pl-3`;
    const sortedClass = fieldName === this.sortField ? ' sorted' : '';
    const otherClass = fieldName === 'pdm' ? ' flex-ctr-hor' : '';

    return `${baseClass}${sortedClass}${otherClass}`;
  }
}
