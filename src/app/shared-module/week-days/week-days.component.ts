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
import { v4 as uuidv4 } from 'uuid';

import { FormControl } from '@angular/forms';
import { Week, getNewWeek } from './week';
import { DropdownEntry } from 'src/app/shared-module/allocate.service';
import { AllocateService } from '../allocate.service';

const weekStrArr = ['mon', 'tue', 'wed', 'thu', 'fri'];

interface CalendarEntry {
  type: 'filled' | 'avail' | 'away';
  value: string;
}

@Component({
  selector: 'week-days',
  templateUrl: './week-days.component.html',
  styleUrls: ['./week-days.component.scss'],
})
export class WeekDaysComponent implements OnInit {
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
    value: val,
  }));

  allocatedTo = new FormControl('');
  showDropdownAtDay!: keyof Week | null;
  dropdownList!: DropdownEntry[];
  id: string = uuidv4();

  constructor(private allocateService: AllocateService) {}

  ngOnInit(): void {}
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['weekObj'] && changes['weekObj'].currentValue) {
      this.weekModel = {
        ...changes['weekObj'].currentValue,
      };
      this.weekDaysArr = Object.entries(this.weekModel).map(([key, value]) => {
        if (typeof value === 'boolean') {
          return { type: value ? 'avail' : 'away', value: key };
        } else {
          return { type: 'filled', value };
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

    if (item.type === 'away') {
      return `btn btn-unavail${disabledCls}`;
    }

    if (item.type === 'avail') {
      return `btn btn-primary${disabledCls}`;
    }

    return `btn-allocated flex flex-hor-ctr flex-ver-ctr`;
  }

  getDropdownClass(weekDay: string): string {
    return this.weekObj[weekDay.toLowerCase() as keyof Week]
      ? `btn btn-success`
      : `btn btn-unavail`;
  }
}
