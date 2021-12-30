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
import { TypeaheadService } from '..//shared-module/typeahead.service';

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
    type: string;
    action: 'add' | 'remove';
  }>();

  tags!: Tag[];
  tagInput = new FormControl('');
  showAddTag: boolean = false;
  tagArr: string[] = getTagArr().map((item) => item.value);

  constructor(private typeaheadService: TypeaheadService) {}

  getTagTypeahead(): string[] {
    const tags = this.person ? this.person.tags : this.tags;

    return this.typeaheadService.getTypeahead(
      this.typeaheadService.fields.Tag,
      tags
    );
  }

  getPDMTypeAhead(key: string): any[] {
    return PEOPLE.map((item) => item[key as keyof Person]);
  }

  setShowAddTag(show: boolean): void {
    this.showAddTag = show;
    setTimeout(() => {
      this.addTagElem.nativeElement.focus();
    }, 0);
  }

  onTagSubmit(submittedBy: 'form' | 'entry'): void {
    const tagObj: Tag | undefined = this.typeaheadService.getTagByVal(
      this.tagInput.value
    );

    console.log({
      tagObj,
    });

    if (tagObj) {
      if (submittedBy === 'entry') {
        this.tagChangeEvent.emit({
          id: this.id,
          value: tagObj.value,
          type: tagObj.type,
          action: 'add',
        });
      } else {
        this.tags = sortTags([
          ...this.tags,
          {
            ...tagObj,
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
        type: '',
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
