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

interface CalendarEntry {
  type: 'filled' | 'empty';
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
    type: 'empty',
    value: val,
  }));

  allocatedTo = new FormControl('');
  showDropdownAtDay!: keyof Week;
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
          return { type: 'empty', value: key };
        } else {
          return { type: 'filled', value };
        }
      });
      console.log(this.weekModel);
      // this.weekDaysArr = this.weekModel.map(())
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
        day: this.showDropdownAtDay,
      });
    }
  }

  handleBtnClick(weekDay: any): void {
    if (this.droppable && !this.inEditMode) {
      this.allocatedTo.setValue('');
      this.dropdownList = this.allocateService.getDataForDay(
        this.displayedIn === 'people' ? 'projects' : 'people',
        weekDay
      );
      this.showDropdownAtDay = weekDay as keyof Week;

      return;
    }
    if (!this.inEditMode) {
      return;
    }
    this.weekModel[weekDay.toLowerCase() as keyof Week] =
      !this.weekModel[weekDay.toLowerCase() as keyof Week];

    this.calendarChange.emit(this.weekModel);
  }

  getBtnClass(weekDay: string): string {
    const disabledCls =
      !this.inEditMode && !this.droppable ? ' btn-inactive' : '';

    return this.weekObj[weekDay.toLowerCase() as keyof Week]
      ? `btn btn-primary${disabledCls}`
      : `btn btn-unavail${disabledCls}`;
  }

  getDropdownClass(weekDay: string): string {
    return this.weekObj[weekDay.toLowerCase() as keyof Week]
      ? `btn btn-success`
      : `btn btn-unavail`;
  }
}
