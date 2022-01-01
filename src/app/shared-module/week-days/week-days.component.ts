import {
  Component,
  OnInit,
  EventEmitter,
  Input,
  Output,
  SimpleChanges,
} from '@angular/core';
import { Week, getNewWeek } from './week';

@Component({
  selector: 'week-days',
  templateUrl: './week-days.component.html',
  styleUrls: ['./week-days.component.scss'],
})
export class WeekDaysComponent implements OnInit {
  @Input() weekObj!: Week;
  @Input() inEditMode: boolean = false;
  @Output() calendarChange = new EventEmitter<Week>();

  weekModel: Week = getNewWeek();
  weekDaysArr = Object.keys(this.weekModel);

  getBtnClass(weekDay: string): string {
    const disabledCls = !this.inEditMode ? ' btn-inactive' : '';

    return this.weekObj[weekDay.toLowerCase() as keyof Week]
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

  ngOnInit(): void {}
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['weekObj'] && changes['weekObj'].currentValue) {
      this.weekModel = {
        ...changes['weekObj'].currentValue,
      };
    }
  }
}
