import {
  Component,
  OnInit,
  EventEmitter,
  Input,
  Output,
  SimpleChanges,
} from '@angular/core';

import { FormControl } from '@angular/forms';
import { Week, WeekAllocated, getNewWeek } from './week';
import { DropdownEntry } from 'src/app/shared-module/lookup.service';
import { LookupService } from '../lookup.service';

@Component({
  selector: 'week-days',
  templateUrl: './week-days.component.html',
  styleUrls: ['./week-days.component.scss'],
})
export class WeekDaysComponent implements OnInit {
  @Input() weekObj!: Week | WeekAllocated;
  @Input() inEditMode: boolean = false;
  @Input() droppable!: boolean;
  @Input() displayedIn!: 'people' | 'projects';
  @Output() calendarChange = new EventEmitter<Week>();

  weekModel: Week = getNewWeek();
  weekDaysArr = Object.keys(this.weekModel);

  allocatedTo = new FormControl('');
  showDropdownAtDay!: keyof Week;
  dropdownList!: DropdownEntry[];

  constructor(private lookupService: LookupService) {}

  ngOnInit(): void {}
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['weekObj'] && changes['weekObj'].currentValue) {
      this.weekModel = {
        ...changes['weekObj'].currentValue,
      };
    }
  }

  handleBtnClick(weekDay: any): void {
    if (this.droppable && !this.inEditMode) {
      this.showDropdownAtDay = weekDay as keyof Week;
      this.dropdownList = this.lookupService.getDataForDay(
        this.displayedIn === 'people' ? 'projects' : 'people',
        weekDay
      );

      console.log({
        dropdownList: this.dropdownList,
      });
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
