import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  Input,
  Output,
  EventEmitter,
  SimpleChanges,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead';
import { PersonEntry } from '../person';
import { Tag } from 'src/app/shared-module/entry/entry.component';
import { TypeaheadService } from '../../shared-module/typeahead.service';
import { ConfigService, Config } from 'src/app/shared-module/config.service';
import { Person } from '../person';
import {
  getWeekDayDate,
  getNewAvailDate,
  getCalendarFromDate,
  removeExtraSpacesFromStr,
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
export class PersonEntryFormComponent
  extends PersonEntry
  implements OnInit, AfterViewInit, OnDestroy
{
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

  @Output() formPendingEvent = new EventEmitter<any>();

  @ViewChild('entryContainer') entryContainer!: ElementRef;

  pdmArr!: string[];
  fmno!: string;
  ignoreNextDateChange: boolean = false;
  initialDate!: Date;
  subscription: Subscription = new Subscription();

  // ***************
  // CONSTRUCTOR
  // ***************

  constructor(
    typeaheadService: TypeaheadService,
    private configService: ConfigService
  ) {
    super(typeaheadService);
  }

  // ***************
  // LIFECYCLE HOOKS
  // ***************

  override ngOnInit(): void {
    if (this.displayedIn === 'ALLOCATE') {
      this.isCollapsed = false;
    }

    if (!this.entryData && this.pdm) {
      this.personForm.patchValue({
        pdm: this.pdm,
      });
    } else if (!this.entryData && !this.pdm) {
      this.personForm.patchValue({
        pdm: 'pdm',
      });
    }

    if (this.entryData) {
      const { name, skill, comments, availDate, pdm } = this
        .entryData as Person;
      this.personForm.setValue({
        name,
        skill,
        comments: comments || '',
        availDate: availDate || '',
        pdm: pdm || '',
      });
      this.tags = this.entryData.tags;
      this.fmno = this.entryData.id;
    } else {
      this.tags = [];
      this.personForm.patchValue({
        skill: 'skill',
      });
    }

    if (this.entryData?.week) {
      this.localCalendarObj = this.entryData.week;
      this.setDaysLeft(this.entryData.week);
    } else {
      this.daysLeft = 5;
      this.localCalendarObj = getNewWeek();
      this.personForm.patchValue({ availDate: this.referenceDate });
    }

    const configSubscr = this.configService.onConfig.subscribe({
      next: (config: Config) => {
        // TODO: add a check to prevent unnecessary updates
        const { pdms } = config;
        this.pdmArr = pdms;
      },
    });

    this.subscription.add(configSubscr);
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  ngAfterViewInit(): void {
    if (!this.entryData) {
      this.entryContainer.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest',
      });
      const nameInput =
        this.entryContainer.nativeElement.querySelector('.input--name');
      nameInput.focus();
    }
  }

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

  handleDelete(): void {
    this.deleteEvent.emit(this.id);
  }

  onSubmit(): void {
    if (!this.personForm.valid) {
      this.validateFormFields();
      return;
    }

    const { name, skill, comments, availDate, pdm } = this.personForm.value;

    if (this.entryData) {
      this.formEditEvent.emit({
        id: this.fmno || this.id,
        name: removeExtraSpacesFromStr(name),
        skill,
        comments: removeExtraSpacesFromStr(comments),
        availDate,
        pdm,
        week: this.localCalendarObj,
        tags: this.tags,
      });
    } else {
      this.formSubmitEvent.emit({
        id: this.fmno || this.id,
        name: removeExtraSpacesFromStr(name),
        skill,
        comments: removeExtraSpacesFromStr(comments),
        availDate,
        pdm,
        week: this.localCalendarObj,
        tags: this.tags,
      });
    }
  }

  onDateChange(date: Date) {
    if (this.entryData && !this.initialDate) {
      this.initialDate = this.entryData.availDate as Date;
      return;
    }

    if (this.ignoreNextDateChange) {
      this.ignoreNextDateChange = false;
    } else {
      const newCalendarObj = getCalendarFromDate(
        date,
        this.localCalendarObj,
        this.referenceDate
      );

      this.personForm.patchValue({ availDate: date });
      this.daysLeft = getDaysLeft(newCalendarObj);
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

  getFieldClasses(fieldName: string): string {
    const baseClass = `section section-${fieldName} mr-12 flex flex-ver-ctr pl-3`;
    const sortedClass = fieldName === this.sortField ? ' sorted' : '';
    let otherClass = fieldName === 'pdm' ? ' flex-ctr-hor' : '';

    return `${baseClass}${sortedClass}${otherClass}`;
  }
}
