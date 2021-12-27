import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  SimpleChanges,
} from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Person, PersonEntry, Tag } from '../person';
import { getPDMArr } from '../../utils/getPDMArr';
import {
  getWeekDayDate,
  getNewAvailDate,
  getCalendarFromDate,
} from '../../utils/';

import {
  Week,
  getNewWeek,
  getDaysLeft,
} from 'src/app/shared-module/week-days/week';
import { PAGE_SECTIONS } from '../../app.component';

@Component({
  selector: 'person-entry-form',
  templateUrl: './person-entry-form.component.html',
  styleUrls: ['./person-entry-form.component.scss'],
})
export class PersonEntryFormComponent extends PersonEntry implements OnInit {
  @Input() id!: string;
  @Input() person!: Person | undefined;
  @Input() sortField!: string;
  @Input() referenceDate!: Date;
  @Input() currPageSection!: keyof typeof PAGE_SECTIONS;
  @Input() dispatchToParentAndClose: boolean = false;

  @Output() deleteEvent = new EventEmitter<string>();
  @Output() calendarChangeEvent = new EventEmitter<{
    id: string;
    calendarObj: Week;
  }>();
  @Output() formEditEvent = new EventEmitter<{
    id: string;
    name: string;
    skill: string;
    comments: string;
    availDate: Date;
    pdm: string;
    week: Week;
    tags: Tag[];
  }>();
  @Output() formSubmitEvent = new EventEmitter<{
    id: string;
    name: string;
    skill: string;
    comments: string;
    availDate: Date;
    pdm: string;
    week: Week;
    tags: Tag[];
  }>();

  daysLeft!: number;
  localCalendarObj!: Week;
  tags!: Tag[];
  pdmArr: string[] = getPDMArr();

  // ***************
  // FORM GROUP
  // ***************

  personForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(3)]),
    skill: new FormControl('', [Validators.required]),
    availDate: new FormControl(getWeekDayDate(1, 'next'), [
      Validators.required,
    ]),
    comments: new FormControl(''),
    pdm: new FormControl(''),
  });

  isFieldValid(field: string) {
    return (
      !this.personForm.get(field)!.valid && this.personForm.get(field)!.touched
    );
  }

  validateFormFields() {
    Object.keys(this.personForm.controls).forEach((field) => {
      const control = this.personForm.get(field);
      control?.markAsTouched({ onlySelf: true });
    });
  }

  // ***************
  // INSTANCE METHODS
  // ***************

  getDaysAvailable(): number {
    return this.daysLeft;
  }

  handleDelete(): void {
    this.deleteEvent.emit(this.id);
  }

  onSubmit(): void {
    if (!this.personForm.valid) {
      this.validateFormFields();
      return;
    }

    const { name, skill, comments, availDate, pdm } = this.personForm.value;

    if (this.person) {
      this.formEditEvent.emit({
        id: this.id,
        name,
        skill,
        comments,
        availDate,
        pdm,
        week: this.localCalendarObj,
        tags: this.tags,
      });
    } else {
      this.formSubmitEvent.emit({
        id: this.id,
        name,
        skill,
        comments,
        availDate,
        pdm,
        week: this.localCalendarObj,
        tags: this.tags,
      });
    }
  }

  onDateChange(date: Date) {
    this.personForm.patchValue({ availDate: date });
  }

  onCalendarChange(calendarObj: Week) {
    const newAvailDate = getNewAvailDate(calendarObj, this.referenceDate);
    this.personForm.patchValue({ availDate: newAvailDate });
    this.updateCalendarView(calendarObj);
  }

  updateCalendarView(calendarObj: Week) {
    this.localCalendarObj = calendarObj;
    this.setDaysLeft(calendarObj);
  }

  setDaysLeft(calendarObj: Week) {
    this.daysLeft = getDaysLeft(calendarObj);
  }

  getFieldClasses(fieldName: string): string {
    const baseClass = `person-${fieldName}-form tbl-row mr-12 flex flex-ctr-ver pl-3`;
    const sortedClass = fieldName === this.sortField ? ' sorted' : '';

    return `${baseClass}${sortedClass}`;
  }

  // ***************
  // CONSTRUCTOR
  // ***************

  constructor() {
    super();
  }

  // ***************
  // LIFECYCLE HOOKS
  // ***************

  ngOnInit(): void {
    if (this.person) {
      const { name, skill, comments, availDate, pdm } = this.person;
      this.personForm.setValue({
        name,
        skill,
        comments: comments || '',
        availDate: availDate || '',
        pdm: pdm || '',
      });
      this.tags = this.person.tags;
    } else {
      this.tags = [];
    }

    if (this.person?.week) {
      this.localCalendarObj = this.person.week;
      this.setDaysLeft(this.person.week);
    } else {
      this.daysLeft = 5;
      this.localCalendarObj = getNewWeek();
      this.personForm.patchValue({ availDate: this.referenceDate });
    }

    this.personForm.get('availDate')!.valueChanges.subscribe((val: Date) => {
      const newCalendarObj = getCalendarFromDate(
        val,
        this.localCalendarObj,
        this.referenceDate
      );
      this.localCalendarObj = newCalendarObj;
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['dispatchToParentAndClose'] &&
      changes['dispatchToParentAndClose'].currentValue === true
    ) {
      this.onSubmit();
    }
  }
}
