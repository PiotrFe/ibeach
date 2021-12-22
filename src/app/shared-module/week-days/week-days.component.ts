import {
  Component,
  OnInit,
  AfterViewInit,
  OnChanges,
  EventEmitter,
  Output,
} from '@angular/core';
import { Week } from './week';

@Component({
  selector: 'week-days',
  templateUrl: './week-days.component.html',
  styleUrls: ['./week-days.component.scss'],
})
export class WeekDaysComponent implements OnInit {
  @Output() daysLeft = new EventEmitter<number>();

  daysAvail!: number;

  weekModel: Week = {
    mon: true,
    tue: true,
    wed: true,
    thu: true,
    fri: true,
  };

  weekDaysArr = Object.keys(this.weekModel);

  getBtnClass(weekDay: string): string {
    return this.weekModel[weekDay.toLowerCase() as keyof Week]
      ? 'btn btn-primary'
      : 'btn btn-disabled';
  }

  handleBtnClick(weekDay: string): void {
    this.weekModel[weekDay.toLowerCase() as keyof Week] =
      !this.weekModel[weekDay.toLowerCase() as keyof Week];

    this.setDaysAvailable();
  }

  setDaysAvailable(): void {
    const daysAvail = Object.values(this.weekModel).reduce(
      (acc, val) => (val ? acc + 1 : acc),
      0
    );

    this.daysAvail = daysAvail;
    this.daysLeft.emit(daysAvail);
  }

  constructor() {
    // this.setDaysAvailable();
  }

  ngOnInit(): void {
    this.setDaysAvailable();
  }

  ngAfterViewInit(): void {
    // this.setDaysAvailable();
  }
}
