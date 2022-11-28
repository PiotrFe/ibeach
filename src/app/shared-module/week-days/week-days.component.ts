import {
  Component,
  OnInit,
  EventEmitter,
  Input,
  Output,
  SimpleChanges,
  ViewChild,
  ElementRef,
  OnDestroy,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subject, takeUntil, pipe } from 'rxjs';
import { Week, getNewWeek } from './week';
import {
  AllocateService,
  DropdownEntry,
} from 'src/app/shared-module/allocate.service';
import { RefreshNowTsService } from 'src/app/shared-module/refresh-now-ts.service';

import { DragAndDropService } from '../drag-and-drop.service';
import { getSkillGroupColor } from 'src/app/utils';

const dayInMs = 1000 * 60 * 60 * 24;
const weekStrArr: string[] = ['mon', 'tue', 'wed', 'thu', 'fri'];

const getDayInt = (day: string): number => {
  const idx = weekStrArr.findIndex((weekDay) => weekDay === day);
  if (idx > -1) {
    return idx + 1;
  }

  return idx;
};

const setTimeToMidnight = (date: Date): Date => {
  const dateCopy = new Date(date.getTime());
  dateCopy.setHours(0);
  dateCopy.setMinutes(0);
  dateCopy.setSeconds(0);
  dateCopy.setMilliseconds(0);

  return dateCopy;
};

const getMondayOfSameWeek = (date: Date): Date => {
  const dateCopy = setTimeToMidnight(new Date(date.getTime()));
  const weekDay = dateCopy.getDay();

  if (weekDay === 1) {
    return date;
  }

  const dayDiff = weekDay === 0 ? 6 : weekDay - 1;

  return new Date(dateCopy.getTime() - dayDiff * dayInMs);
};

export const isDayInPast = (day: keyof Week, referenceDate: Date): boolean => {
  // get monday of current week;
  // check if ref date equal to that monday

  // 1. If equal, compare day with today's day
  // 2. If older, return true

  const referenceDateCopy = setTimeToMidnight(
    new Date(referenceDate.getTime())
  );
  const today = setTimeToMidnight(new Date(Date.now()));
  const lastMonday = getMondayOfSameWeek(today);

  if (referenceDateCopy < lastMonday) {
    return true;
  }

  const dayInt = getDayInt(day);
  const todayInt = today.getDay();
  return dayInt < todayInt;
};

interface CalendarEntry {
  type: 'filled' | 'avail' | 'away';
  day: keyof Week;
  value: {
    id: string | null;
    text: string;
    skill?: string;
  };
  past?: boolean;
}

@Component({
  selector: 'week-days',
  templateUrl: './week-days.component.html',
  styleUrls: ['./week-days.component.scss'],
})
export class WeekDaysComponent implements OnInit, OnDestroy {
  @Input() id!: string;
  @Input() weekObj!: Week;
  @Input() inEditMode: boolean = false;
  @Input() droppable!: boolean;
  @Input() displayedIn!: 'people' | 'projects';
  @Input() excludePast!: boolean;
  @Input() referenceDate!: Date;

  @Output() calendarChange = new EventEmitter<Week>();
  @Output() allocation = new EventEmitter<{
    id: string;
    value: string;
    day: string;
    skill?: string;
  }>();
  @ViewChild('dropdown') dropdown!: ElementRef;

  currentTs: number = Date.now();
  onDestroy$: Subject<void> = new Subject<void>();

  weekModel: Week = getNewWeek();
  weekDaysArr: CalendarEntry[] = Object.keys(this.weekModel).map((val) => ({
    type: 'avail',
    day: val as keyof Week,
    value: {
      id: null,
      text: val,
    },
  }));

  allocatedTo = new FormControl('');
  showDropdownAtDay!: keyof Week | null;
  dropdownList!: DropdownEntry[];

  constructor(
    private allocateService: AllocateService,
    private dragAndDrop: DragAndDropService,
    private refreshTsService: RefreshNowTsService
  ) {}

  ngOnInit(): void {
    this.refreshTsService.timestamp$
      .pipe(takeUntil(this.onDestroy$))
      .subscribe((ts) => {
        this.currentTs = ts;
      }); // Todo: refresh week view on each tick
  }
  ngOnChanges(changes: SimpleChanges): void {
    let refreshWeek = false;

    if (changes['weekObj'] && changes['weekObj'].currentValue) {
      this.weekModel = {
        ...changes['weekObj'].currentValue,
      };
      refreshWeek = true;
    }

    if (changes['excludePast']) {
      refreshWeek = true;
    }

    if (refreshWeek) {
      this.refreshWeek();
    }
  }

  ngOnDestroy(): void {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  refreshWeek() {
    this.weekDaysArr = Object.entries(this.weekModel).map(([key, value]) => {
      const day = key as keyof Week;
      if (typeof value === 'boolean') {
        return {
          type: value ? 'avail' : 'away',
          day,
          value: {
            id: null,
            text: key,
          },
          ...(this.excludePast && {
            past: isDayInPast(day, this.referenceDate),
          }),
        };
      } else {
        return {
          type: 'filled',
          day,
          value,
          ...(this.excludePast && {
            past: isDayInPast(day, this.referenceDate),
          }),
        };
      }
    });
  }

  getDropdownTypeahead(): string[] {
    return this.dropdownList.map((item) => item.value);
  }

  onDropdownSubmit(): void {
    const name = this.allocatedTo.value;
    const dropDowndownEntry = this.dropdownList.find(
      (entry) => entry.value === name
    );

    if (dropDowndownEntry) {
      this.allocation.emit({
        id: dropDowndownEntry.id,
        value: dropDowndownEntry.value,
        day: this.showDropdownAtDay as string,
        ...(dropDowndownEntry?.skill && {
          skill: dropDowndownEntry.skill,
        }),
      });

      this.showDropdownAtDay = null;
    }
  }

  onInputBlur(e: any): void {
    const { relatedTarget } = e;

    if (relatedTarget && relatedTarget.classList.contains('dropdown-item')) {
      return;
    }
    this.showDropdownAtDay = null;
  }

  handleBtnClick(idx: number): void {
    const weekDay = weekStrArr[idx] as keyof Week;
    const weekAllocationItem = this.weekDaysArr[idx];

    if (weekAllocationItem.past) {
      return;
    }

    if (!this.inEditMode && weekAllocationItem.type === 'away') {
      return;
    }

    if (weekAllocationItem.type === 'filled') {
      return;
    }

    if (this.droppable && !this.inEditMode) {
      this.allocatedTo.setValue('');
      this.dropdownList = this.allocateService.getDataForDay(
        this.displayedIn === 'people' ? 'projects' : 'people',
        weekDay
      );
      this.showDropdownAtDay = weekDay;

      setTimeout(() => {
        this.dropdown.nativeElement.focus();
      }, 0);

      return;
    }
    if (!this.inEditMode) {
      return;
    }
    this.weekModel[weekDay.toLowerCase() as keyof Week] =
      !this.weekModel[weekDay.toLowerCase() as keyof Week];

    this.calendarChange.emit(this.weekModel);
  }

  getClass(idx: number): string {
    const item = this.weekDaysArr[idx];
    const disabledCls =
      (!this.inEditMode && !this.droppable) || item.past ? ' btn-inactive' : '';
    const activeDragAndDropFor =
      this.displayedIn === 'people' ? 'projects' : 'people';
    const isPastItem = this.excludePast && item.past;

    if (item.type === 'away') {
      return `btn btn-unavail${disabledCls} cal-entry cal-entry--${item.day}`;
    }

    if (item.type === 'avail') {
      let baseColor = isPastItem ? 'past' : 'light';
      let classes = `btn btn-primary btn-primary--${baseColor}${disabledCls} cal-entry cal-entry--${item.day}`;

      return !this.inEditMode && !isPastItem
        ? `${classes} droppable droppable-${activeDragAndDropFor}`
        : classes;
    }

    let pastSuffix = !isPastItem ? ' ' : ' btn-allocated-past ';
    let baseAllocated = ` btn-allocated${pastSuffix}`;
    let btnColor = '';
    if (this.displayedIn === 'projects' && item.value.skill) {
      const skillColor = getSkillGroupColor(item.value.skill);
      btnColor = ` btn-allocated--${skillColor} `;
    }

    let classes = `${baseAllocated}${btnColor}cal-entry cal-entry--${item.day} flex flex-hor-ctr flex-ver-ctr`;

    return !this.inEditMode && !isPastItem
      ? `${classes} draggable draggable-${activeDragAndDropFor}`
      : classes;
  }

  getDropdownClass(weekDay: string): string {
    return this.weekObj[weekDay.toLowerCase() as keyof Week]
      ? `btn btn-success`
      : `btn btn-unavail`;
  }

  handleDragStart(event: any, idx: number) {
    const day = weekStrArr[idx] as keyof Week;
    this.dragAndDrop.onDragStart(event, this.id, day, this.displayedIn);
    return false;
  }
}
