import {
  Component,
  OnInit,
  AfterViewInit,
  OnChanges,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { Week, getNewWeek } from './week';

@Component({
  selector: 'week-days',
  templateUrl: './week-days.component.html',
  styleUrls: ['./week-days.component.scss'],
})
export class WeekDaysComponent implements OnInit {
  @Input() weekObj!: Week | undefined;
  @Input() inEditMode: boolean = false;

  @Output() calendarChange = new EventEmitter<Week>();
  weekModel: Week = getNewWeek();

  weekDaysArr = Object.keys(this.weekModel);

  getBtnClass(weekDay: string): string {
    const disabledCls = !this.inEditMode ? ' btn-inactive' : '';

    return this.weekModel[weekDay.toLowerCase() as keyof Week]
      ? `btn btn-primary${disabledCls}`
      : `btn btn-unavail${disabledCls}`;
  }

  handleBtnClick(weekDay: string): void {
    if (!this.inEditMode) {
      return;
    }
    this.weekModel[weekDay.toLowerCase() as keyof Week] =
      !this.weekModel[weekDay.toLowerCase() as keyof Week];

    this.calendarChange.emit(this.weekModel);
  }

  constructor() {}

  ngOnInit(): void {
    if (this.weekObj) {
      this.weekModel = {
        ...this.weekObj,
      };
    }
  }
}
