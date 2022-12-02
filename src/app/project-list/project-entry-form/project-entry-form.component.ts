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
  OnDestroy,
} from '@angular/core';
import { fromEvent, Subject, takeUntil } from 'rxjs';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead';
import { EntryComponent } from 'src/app/shared-module/entry/entry.component';
import { TypeaheadService } from 'src/app/shared-module/typeahead.service';
import { ReferenceDateService } from 'src/app/shared-module/reference-date.service';

import {
  LeadershipEntry,
  Project,
  ProjectEvent,
  ProjectPriority,
} from '../project-list/project';
import { Tag } from 'src/app/shared-module/entry/entry.component';
import {
  getWeekDayDate,
  getNewAvailDate,
  getCalendarFromDate,
  removeExtraSpacesFromStr,
  cleanString,
  getPrioClasses,
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
  implements OnInit, AfterViewInit, OnDestroy
{
  private onDestroy$: Subject<void> = new Subject<void>();

  @Input() dispatchToParentAndClose: boolean = false;
  @Input() cleanSlate!: boolean;

  @Output() formEditEvent = new EventEmitter<ProjectEvent>();
  @Output() formSubmitEvent = new EventEmitter<ProjectEvent>();
  @Output() formPendingEvent = new EventEmitter<any>();

  @ViewChild('entryContainer') entryContainer!: ElementRef;
  @ViewChild('leadershipInput') leadershipInput!: ElementRef;
  @ViewChild('leadershipInputSecondary') leadershipInputSecondary!: ElementRef;

  priority: ProjectPriority | undefined = undefined;
  getPrioClasses = getPrioClasses;

  constructor(
    typeaheadService: TypeaheadService,
    referenceDateService: ReferenceDateService
  ) {
    super(typeaheadService, referenceDateService);
  }

  projectForm = new FormGroup({
    client: new FormControl('', [Validators.required]),
    type: new FormControl('', [Validators.required]),
    availDate: new FormControl(getWeekDayDate(1, 'next'), [
      Validators.required,
    ]),
    comments: new FormControl(''),
    leadership: new FormControl('', [Validators.required]),
    leadershipNew: new FormControl({ value: '', disabled: true }),
  });

  cstInput = new FormControl('');

  ignoreNextDateChange: boolean = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['dispatchToParentAndClose'] &&
      changes['dispatchToParentAndClose'].currentValue === true
    ) {
      this.onSubmit();
    }
  }

  ngOnInit(): void {
    this.subscribeToServices();
    this.isCollapsed = false;

    if (this.entryData) {
      const { client, type, comments, availDate, leadership, priority } = this
        .entryData as Project;
      this.projectForm.setValue({
        client,
        type,
        comments: comments || '',
        availDate: availDate || this.referenceDate,
        leadership: !leadership.length
          ? ''
          : leadership.reduce<string>(
              (
                acc: string,
                elem: LeadershipEntry,
                idx: number,
                arr: LeadershipEntry[]
              ) => {
                let str = `${acc} ${elem.name}`;

                if (idx < arr.length - 1) {
                  return `${str}, `;
                }

                return `${str}`;
              },
              ''
            ),
        leadershipNew: '',
      });
      this.tags = this.entryData.tags;
      this.id = this.entryData.id;
      this.priority = (this.entryData as Project).priority;
      if (leadership.length) {
        this.projectForm.get('leadershipNew')?.enable();
      }
    } else {
      this.tags = [];
      this.projectForm.patchValue({
        type: 'LOP',
      });
    }

    if (this.entryData?.week) {
      this.localCalendarObj = this.entryData.week;
    } else {
      this.localCalendarObj = getNewWeek();
      this.projectForm.patchValue({ availDate: this.referenceDate });
    }
    this.setDaysLeft(this.localCalendarObj);
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

    this.addListeners();
  }

  ngOnDestroy(): void {
    this.unsubscribeFromServices();
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  addListeners(): void {
    fromEvent(this.leadershipInput.nativeElement, 'focus')
      .pipe(takeUntil(this.onDestroy$))
      .subscribe(
        () =>
          ((
            this.leadershipInputSecondary.nativeElement as HTMLInputElement
          ).disabled = true)
      );

    fromEvent(this.leadershipInput.nativeElement, 'blur')
      .pipe(takeUntil(this.onDestroy$))
      .subscribe(() => {
        this.projectForm.patchValue({
          leadershipNew: '',
        });

        if (this.projectForm.get('leadership')?.value.length) {
          (
            this.leadershipInputSecondary.nativeElement as HTMLInputElement
          ).disabled = false;
        }
      });

    fromEvent(this.leadershipInputSecondary.nativeElement, 'focus')
      .pipe(takeUntil(this.onDestroy$))
      .subscribe(
        () =>
          ((this.leadershipInput.nativeElement as HTMLInputElement).disabled =
            true)
      );

    fromEvent(this.leadershipInputSecondary.nativeElement, 'blur')
      .pipe(takeUntil(this.onDestroy$))
      .subscribe(() => {
        this.projectForm.patchValue({
          leadershipNew: '',
        });

        (this.leadershipInput.nativeElement as HTMLInputElement).disabled =
          false;
      });

    fromEvent(this.leadershipInputSecondary.nativeElement, 'keyup')
      .pipe(takeUntil(this.onDestroy$))
      .subscribe((e: any) => {
        if (e.key === 'Enter') {
          this.handleSubmitLeader(this.projectForm.get('leadershipNew')?.value);
        }
      });
  }

  handleDelete(): void {
    this.deleteEvent.emit(this.id);
  }

  handleDuplicate(): void {
    const { client, type, comments, availDate, leadership } =
      this.projectForm.value;

    if (!this.cleanSlate) {
      this.formEditEvent.emit({
        id: this.id,
        client: removeExtraSpacesFromStr(client),
        type,
        comments: removeExtraSpacesFromStr(comments),
        availDate,
        week: getNewWeek(),
        tags: this.tags,
        leadership: getLeadershipStringArr(leadership),
        doDuplicate: true,
      });
    } else {
      this.formSubmitEvent.emit({
        id: this.id,
        client: removeExtraSpacesFromStr(client),
        type,
        comments: removeExtraSpacesFromStr(comments),
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
        client: removeExtraSpacesFromStr(client),
        type,
        comments: removeExtraSpacesFromStr(comments),
        availDate,
        week: this.localCalendarObj,
        tags: this.tags,
        leadership: getLeadershipStringArr(leadership),
        ...(this.priority && {
          priority: this.priority,
        }),
      });
    } else {
      this.formSubmitEvent.emit({
        id: this.id,
        client: removeExtraSpacesFromStr(client),
        type,
        comments: removeExtraSpacesFromStr(comments),
        availDate,
        week: this.localCalendarObj,
        tags: this.tags,
        leadership: getLeadershipStringArr(leadership),
        ...(this.priority && {
          priority: this.priority,
        }),
      });
    }
  }

  setDaysLeft(calendarObj: Week) {
    this.daysLeft = getDaysLeft(
      calendarObj,
      this.excludePast,
      this.referenceDate
    );
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
      !this.projectForm.get(field)!.valid && this.projectForm.get(field)!.dirty
    );
  }

  validateFormFields() {
    Object.keys(this.projectForm.controls).forEach((field) => {
      const control = this.projectForm.get(field);
      control?.markAsDirty({ onlySelf: true });
    });
  }

  onLeadershipSubmit(entry: TypeaheadMatch) {
    this.handleSubmitLeader(entry.value);
  }

  handleSubmitLeader(name: string) {
    const leadershipStr = this.#getUpdatedLeadershipString(name);
    this.projectForm.patchValue({
      leadership: leadershipStr.length ? leadershipStr : name,
      leadershipNew: '',
    });
  }

  #getUpdatedLeadershipString(newName: string): string {
    let leadershipStr = this.projectForm.get('leadership')?.value;
    if (leadershipStr.length) {
      const arr = leadershipStr
        .split(',')
        .map((entry: any) => cleanString(entry, false));
      const set = new Set([...arr, cleanString(newName)]);
      leadershipStr = [...set].join(', ');
    }

    return leadershipStr;
  }

  onPrioClick(): void {
    if (this.priority === undefined) {
      this.priority = 0;
    }

    if (this.priority < 3) {
      this.priority = (this.priority + 1) as ProjectPriority;
      return;
    }
    if (this.priority === 3) {
      this.priority = 0;
    }
  }

  // onNameSelect(name: TypeaheadMatch) {
  //   const { value } = name;
  //   const person = this.typeaheadService.getPersonByName(value);

  //   if (person) {
  //     this.personForm.patchValue({
  //       skill: person.skill,
  //       pdm: person.pdm,
  //     });
  //     this.tags = person.tags;
  //     this.fmno = person.id;
  //   }
  // }
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
    .map((elem: string) => capitalizeFirst(removeExtraSpacesFromStr(elem)));

  return Array.from(new Set(arr));
};
