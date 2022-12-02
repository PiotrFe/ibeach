import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';

import { FormControl } from '@angular/forms';
import { trigger, style, animate, transition } from '@angular/animations';

import { Subject, pipe, takeUntil } from 'rxjs';

import { Week, getDaysLeft } from 'src/app/shared-module/week-days/week';
import { TypeaheadService } from 'src/app/shared-module/typeahead.service';
import { ReferenceDateService } from 'src/app/shared-module/reference-date.service';
import { sortTags } from 'src/app/utils';
import { Project } from 'src/app/project-list/project-list/project';
import { Person } from 'src/app/people-list/person';

export interface Tag {
  type: string;
  value: string;
  percent?: number;
}

@Component({
  template: '',
  animations: [
    trigger('blockInitialRenderAnimation', [transition(':enter', [])]),
    trigger('insertRemoveTrigger', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('180ms', style({ opacity: 1 })),
      ]),
      transition(':leave', [animate('180ms', style({ opacity: 0 }))]),
    ]),
  ],
})
export class EntryComponent {
  @ViewChild('addTag') addTagElem!: ElementRef;

  @Input() id!: string;
  @Input() sortField!: string;
  @Input() isCollapsed!: boolean;
  @Input() entryData!: Person | Project;
  @Input() inEditMode!: boolean;
  @Input() editable: boolean = true;
  @Input() entryContainerWidth!: number;

  @Output() editEvent = new EventEmitter<string>();
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
  @Output() collapseEvent = new EventEmitter<{
    id: string;
    collapsed: boolean;
  }>();

  daysLeft!: number;
  localCalendarObj!: Week;
  showAddTag: boolean = false;
  tags!: Tag[];
  tagInput = new FormControl('');

  typeaheadService: TypeaheadService;
  referenceDateService: ReferenceDateService;
  tagArr!: string[];

  excludePast: boolean = false;
  referenceDate!: Date;

  entryDestroy$: Subject<void> = new Subject<void>();

  constructor(
    typeaheadService: TypeaheadService,
    referenceDateService: ReferenceDateService
  ) {
    this.typeaheadService = typeaheadService;
    this.referenceDateService = referenceDateService;
  }

  subscribeToServices() {
    this.referenceDateService.onReferenceDateChange$
      .pipe(takeUntil(this.entryDestroy$))
      .subscribe({
        next: ({ referenceDate, excludePast }) => {
          if (referenceDate !== undefined) {
            this.referenceDate = referenceDate;
          }
          if (excludePast !== undefined) {
            this.excludePast = excludePast;
          }
          if (referenceDate !== undefined || excludePast !== undefined) {
            this.daysLeft = getDaysLeft(
              this.entryData?.week || this.localCalendarObj,
              this.excludePast,
              this.referenceDate
            );
          }
        },
      });
  }

  unsubscribeFromServices() {
    this.entryDestroy$.next();
    this.entryDestroy$.complete();
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

  handleCollapse(): void {
    this.collapseEvent.emit({
      id: this.id,
      collapsed: !this.isCollapsed,
    });
  }

  getTagTypeahead(): string[] {
    return this.typeaheadService.getTypeahead(
      this.typeaheadService.fields.Tag,
      this.entryData?.tags || this.tags
    );
  }
}
