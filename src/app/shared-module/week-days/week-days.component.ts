import {
  Component,
  OnInit,
  EventEmitter,
  Input,
  Output,
  SimpleChanges,
  ViewChild,
  ElementRef,
} from '@angular/core';

import { FormControl } from '@angular/forms';
import { Week, getNewWeek } from './week';
import {
  AllocateService,
  DropdownEntry,
} from 'src/app/shared-module/allocate.service';

import { DragAndDropService } from '../drag-and-drop.service';

const weekStrArr = ['mon', 'tue', 'wed', 'thu', 'fri'];

interface CalendarEntry {
  type: 'filled' | 'avail' | 'away';
  day: keyof Week;
  value: {
    id: string | null;
    text: string;
  };
}

@Component({
  selector: 'week-days',
  templateUrl: './week-days.component.html',
  styleUrls: ['./week-days.component.scss'],
})
export class WeekDaysComponent implements OnInit {
  @Input() id!: string;
  @Input() weekObj!: Week;
  @Input() inEditMode: boolean = false;
  @Input() droppable!: boolean;
  @Input() displayedIn!: 'people' | 'projects';
  @Output() calendarChange = new EventEmitter<Week>();
  @Output() allocation = new EventEmitter<{
    id: string;
    value: string;
    day: string;
  }>();
  @ViewChild('dropdown') dropdown!: ElementRef;

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
    private dragAndDrop: DragAndDropService
  ) {}

  ngOnInit(): void {}
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['weekObj'] && changes['weekObj'].currentValue) {
      this.weekModel = {
        ...changes['weekObj'].currentValue,
      };
      this.weekDaysArr = Object.entries(this.weekModel).map(([key, value]) => {
        if (typeof value === 'boolean') {
          return {
            type: value ? 'avail' : 'away',
            day: key as keyof Week,
            value: {
              id: null,
              text: key,
            },
          };
        } else {
          return { type: 'filled', day: key as keyof Week, value };
        }
      });
    }
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

    if (!this.inEditMode && weekAllocationItem.type === 'away') {
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
      !this.inEditMode && !this.droppable ? ' btn-inactive' : '';
    const activeDragAndDropFor =
      this.displayedIn === 'people' ? 'projects' : 'people';

    if (item.type === 'away') {
      return `btn btn-unavail${disabledCls} cal-entry`;
    }

    if (item.type === 'avail') {
      return `btn btn-primary${disabledCls} cal-entry droppable droppable-${activeDragAndDropFor}`;
    }

    return `btn-allocated cal-entry draggable draggable-${activeDragAndDropFor} flex flex-hor-ctr flex-ver-ctr`;
  }

  getDropdownClass(weekDay: string): string {
    return this.weekObj[weekDay.toLowerCase() as keyof Week]
      ? `btn btn-success`
      : `btn btn-unavail`;
  }

  handlePointerDown(event: any, idx: number) {
    const day = weekStrArr[idx] as keyof Week;
    this.dragAndDrop.onPointerDown(event, this.id, day, this.displayedIn);
  }
}
