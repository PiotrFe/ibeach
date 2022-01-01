import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  SimpleChanges,
} from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead';
import { PersonEntry, Tag } from '../person';
import { TypeaheadService } from '../../shared-module/typeahead.service';
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

@Component({
  selector: 'person-entry-form',
  templateUrl: './person-entry-form.component.html',
  styleUrls: ['./person-entry-form.component.scss'],
})
export class PersonEntryFormComponent extends PersonEntry implements OnInit {
  @Input() referenceDate!: Date;
  @Input() dispatchToParentAndClose: boolean = false;
  @Input() pdm!: string;
  @Input() getNameTypeAhead!: Function;

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
  pdmArr: string[] = getPDMArr();
  fmno!: string;
  ignoreNextDateChange: boolean = false;

  // ***************
  // CONSTRUCTOR
  // ***************

  constructor(typeaheadService: TypeaheadService) {
    super(typeaheadService);
  }

  // ***************
  // LIFECYCLE HOOKS
  // ***************

  ngOnInit(): void {
    if (this.displayedIn === 'ALLOCATE') {
      this.isCollapsed = false;
    }

    if (!this.person && this.pdm) {
      this.personForm.patchValue({
        pdm: this.pdm,
      });
    }

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
  }

  ngAfterViewInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['dispatchToParentAndClose'] &&
      changes['dispatchToParentAndClose'].currentValue === true
    ) {
      this.onSubmit();
    }
  }

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
    pdm: new FormControl(this.pdm),
  });

  onNameSelect(name: TypeaheadMatch) {
    const { value } = name;
    const person = this.typeaheadService.getPersonByName(value);

    if (person) {
      this.personForm.patchValue({
        skill: person.skill,
        pdm: person.pdm,
      });
      this.tags = person.tags;
      this.fmno = person.id;
    }
  }

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
        id: this.fmno || this.id,
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
        id: this.fmno || this.id,
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
    if (this.ignoreNextDateChange) {
      this.ignoreNextDateChange = false;
    } else {
      this.personForm.patchValue({ availDate: date });
      const newCalendarObj = getCalendarFromDate(
        date,
        this.localCalendarObj,
        this.referenceDate
      );
      this.localCalendarObj = newCalendarObj;
    }
  }

  onCalendarChange(calendarObj: Week) {
    this.ignoreNextDateChange = true;
    const newAvailDate = getNewAvailDate(calendarObj, this.referenceDate);
    this.personForm.patchValue({ availDate: newAvailDate });
    this.localCalendarObj = calendarObj;
    this.setDaysLeft(calendarObj);
  }

  setDaysLeft(calendarObj: Week) {
    this.daysLeft = getDaysLeft(calendarObj);
  }
}
