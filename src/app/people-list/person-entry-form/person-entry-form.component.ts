import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Person, PersonEntry } from '../person';
import { Week, getNewWeek } from 'src/app/shared-module/week-days/week';

@Component({
  selector: 'person-entry-form',
  templateUrl: './person-entry-form.component.html',
  styleUrls: ['./person-entry-form.component.scss'],
})
export class PersonEntryFormComponent extends PersonEntry implements OnInit {
  @Input() idx!: number;
  @Input() person!: Person | undefined;
  @Output() deleteEvent = new EventEmitter<number>();
  @Output() calendarChangeEvent = new EventEmitter<{
    calendarObj: Week;
    idx: number;
  }>();
  @Output() formEditEvent = new EventEmitter<{
    name: string;
    skill: string;
    comments: string;
    idx: number;
  }>();
  @Output() formSubmitEvent = new EventEmitter<{
    name: string;
    skill: string;
    comments: string;
    idx: number;
    week: Week;
  }>();

  constructor() {
    super();
  }

  localCalendarObj!: Week;

  personForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(3)]),
    skill: new FormControl('', [Validators.required]),
    comments: new FormControl(''),
  });

  handleDelete(): void {
    this.deleteEvent.emit(this.idx);
  }

  onSubmit(): void {
    const { name, skill, comments } = this.personForm.value;

    if (this.person) {
      this.formEditEvent.emit({
        name,
        skill,
        comments,
        idx: this.idx,
      });
    } else {
      this.formSubmitEvent.emit({
        name,
        skill,
        comments,
        week: this.localCalendarObj,
        idx: this.idx,
      });
    }
  }

  onCalendarChange(calendarObj: Week) {
    if (this.person) {
      this.calendarChangeEvent.emit({ calendarObj, idx: this.idx });
    } else {
      this.localCalendarObj = calendarObj;
      this.setDaysLeft(calendarObj);
    }
  }

  setDaysLeft(calendarObj: Week) {
    this.daysLeft = Object.values(calendarObj).reduce(
      (acc, val) => (val ? acc + 1 : acc),
      0
    );
  }

  ngOnInit(): void {
    if (this.person) {
      const { name, skill, comments } = this.person;
      this.personForm.setValue({
        name,
        skill,
        comments,
      });
    }

    if (this.person?.week) {
      this.setDaysLeft(this.person?.week);
    } else {
      this.daysLeft = 5;
      this.localCalendarObj = getNewWeek();
    }
  }

  ngOnChanges() {}
}
