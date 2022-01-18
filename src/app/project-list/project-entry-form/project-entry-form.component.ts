import {
  Component,
  OnInit,
  AfterViewInit,
  Input,
  Output,
  EventEmitter,
  SimpleChanges,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { EntryComponent } from 'src/app/shared-module/entry/entry.component';
import { TypeaheadService } from 'src/app/shared-module/typeahead.service';

import { Project } from '../project-list/project';
import { Tag } from 'src/app/shared-module/entry/entry.component';
import {
  getWeekDayDate,
  getNewAvailDate,
  getCalendarFromDate,
} from 'src/app/utils';
import {
  Week,
  getDaysLeft,
  getNewWeek,
} from 'src/app/shared-module/week-days/week';

@Component({
  selector: 'project-entry-form',
  templateUrl: './project-entry-form.component.html',
  styleUrls: ['./project-entry-form.component.scss'],
})
export class ProjectEntryFormComponent
  extends EntryComponent
  implements OnInit, AfterViewInit
{
  @Input() dispatchToParentAndClose: boolean = false;
  @Input() cleanSlate!: boolean;

  @Output() formEditEvent = new EventEmitter<{
    id: string;
    client: string;
    type: string;
    comments: string;
    availDate: Date;
    week: Week;
    tags: Tag[];
    leadership: string[];
    doDuplicate?: boolean;
  }>();
  @Output() formSubmitEvent = new EventEmitter<{
    id: string;
    client: string;
    type: string;
    comments: string;
    availDate: Date;
    week: Week;
    tags: Tag[];
    leadership: string[];
    doDuplicate?: boolean;
  }>();

  @Output() formPendingEvent = new EventEmitter<any>();

  @ViewChild('entryContainer') entryContainer!: ElementRef;

  showAddLeader: boolean = false;

  constructor(typeaheadService: TypeaheadService) {
    super(typeaheadService);
  }

  ngOnInit(): void {
    this.isCollapsed = false;

    if (this.entryData) {
      const { client, type, comments, availDate, leadership } = this
        .entryData as Project;
      this.projectForm.setValue({
        client,
        type,
        comments: comments || '',
        availDate: availDate || this.referenceDate,
        leadership: !leadership.length
          ? ''
          : leadership.reduce(
              (
                acc: string,
                elem: string,
                idx: number,
                arr: string[]
              ): string => {
                if (idx < arr.length - 1) {
                  return `${acc} ${elem}, `;
                }

                return `${acc} ${elem}`;
              },
              ''
            ),
      });
      this.tags = this.entryData.tags;
      this.id = this.entryData.id;
    } else {
      this.tags = [];
      this.projectForm.patchValue({
        type: 'LOP',
      });
    }

    if (this.entryData?.week) {
      this.localCalendarObj = this.entryData.week;
      this.setDaysLeft(this.entryData.week);
    } else {
      this.daysLeft = 5;
      this.localCalendarObj = getNewWeek();
      this.projectForm.patchValue({ availDate: this.referenceDate });
    }
  }

  ngAfterViewInit(): void {
    if (this.cleanSlate) {
      this.entryContainer.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest',
      });

      const clientInput =
        this.entryContainer.nativeElement.querySelector('.input--client');
      clientInput.focus();
    }
  }

  projectForm = new FormGroup({
    client: new FormControl('', [Validators.required]),
    type: new FormControl('', [Validators.required]),
    availDate: new FormControl(getWeekDayDate(1, 'next'), [
      Validators.required,
    ]),
    comments: new FormControl(''),
    leadership: new FormControl('', [Validators.required]),
  });

  cstInput = new FormControl('');

  ignoreNextDateChange: boolean = false;

  handleDelete(): void {
    this.deleteEvent.emit(this.id);
  }

  handleDuplicate(): void {
    const { client, type, comments, availDate, leadership } =
      this.projectForm.value;

    if (!this.cleanSlate) {
      this.formEditEvent.emit({
        id: this.id,
        client,
        type,
        comments,
        availDate,
        week: getNewWeek(),
        tags: this.tags,
        leadership: getLeadershipStringArr(leadership),
        doDuplicate: true,
      });
    } else {
      this.formSubmitEvent.emit({
        id: this.id,
        client,
        type,
        comments,
        availDate,
        week: getNewWeek(),
        tags: this.tags,
        leadership: getLeadershipStringArr(leadership),
        doDuplicate: true,
      });
    }
  }

  onCalendarChange(calendarObj: Week) {
    this.ignoreNextDateChange = true;
    const newAvailDate = getNewAvailDate(calendarObj, this.referenceDate);
    this.projectForm.patchValue({ availDate: newAvailDate });
    this.localCalendarObj = calendarObj;
    this.setDaysLeft(calendarObj);
  }

  onDateChange(date: Date) {
    if (this.ignoreNextDateChange) {
      this.ignoreNextDateChange = false;
    } else {
      this.projectForm.patchValue({ availDate: date });
      const newCalendarObj = getCalendarFromDate(
        date,
        this.localCalendarObj,
        this.referenceDate
      );
      this.localCalendarObj = newCalendarObj;
    }
  }

  onSubmit(): void {
    if (!this.projectForm.valid) {
      this.validateFormFields();
      this.formPendingEvent.emit();
      return;
    }

    const { client, type, comments, availDate, leadership } =
      this.projectForm.value;

    if (!this.cleanSlate) {
      this.formEditEvent.emit({
        id: this.id,
        client,
        type,
        comments,
        availDate,
        week: this.localCalendarObj,
        tags: this.tags,
        leadership: getLeadershipStringArr(leadership),
      });
    } else {
      this.formSubmitEvent.emit({
        id: this.id,
        client,
        type,
        comments,
        availDate,
        week: this.localCalendarObj,
        tags: this.tags,
        leadership: getLeadershipStringArr(leadership),
      });
    }
  }

  setDaysLeft(calendarObj: Week) {
    this.daysLeft = getDaysLeft(calendarObj);
  }

  getFieldClasses(fieldName: string): string {
    const baseClass = `section section-${fieldName} mr-12 flex flex-ver-ctr pl-3`;
    const sortedClass = fieldName === this.sortField ? ' sorted' : '';
    const otherClass = fieldName === 'pdm' ? ' flex-ctr-hor' : '';

    return `${baseClass}${sortedClass}${otherClass}`;
  }

  getDaysAvailable(): number {
    return this.daysLeft;
  }

  isFieldValid(field: string) {
    return (
      !this.projectForm.get(field)!.valid &&
      this.projectForm.get(field)!.touched
    );
  }

  validateFormFields() {
    Object.keys(this.projectForm.controls).forEach((field) => {
      const control = this.projectForm.get(field);
      control?.markAsTouched({ onlySelf: true });
    });
  }

  onLeaderDelete(person: string) {
    console.log('Click');
  }

  onLeaderSubmit(): void {}

  setShowAddLeader(show: boolean) {
    this.showAddLeader = show;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['dispatchToParentAndClose'] &&
      changes['dispatchToParentAndClose'].currentValue === true
    ) {
      this.onSubmit();
    }
  }

  override getTagTypeahead(): string[] {
    const tags = this.cleanSlate ? this.entryData.tags : this.tags;

    return this.typeaheadService.getTypeahead(
      this.typeaheadService.fields.Tag,
      tags
    );
  }
}

const capitalizeFirst = (str: string): string => {
  const arr = str.split(' ');
  return arr
    .map((word) => `${word[0].toUpperCase()}${word.slice(1)}`)
    .join(' ');
};

const getLeadershipStringArr = (str: string): string[] => {
  if (str === '') {
    return [];
  }
  const arr = str
    .split(', ')
    .map((elem: string) => capitalizeFirst(elem.trim()));

  return Array.from(new Set(arr));
};
