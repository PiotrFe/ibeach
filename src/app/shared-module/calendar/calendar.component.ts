import {
  Component,
  OnInit,
  OnChanges,
  SimpleChanges,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { getWeekDayDate } from '../../utils';

@Component({
  selector: 'calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
})
export class CalendarComponent implements OnInit, OnChanges {
  @Input() scrollable: boolean = false;
  @Input() weekly: boolean = false;
  @Input() showError: boolean = false;
  @Input() baseDay: number = 1;
  @Input() dateVal!: Date;

  @Output() dateChangeEvent = new EventEmitter<Date>();

  displayDate = new FormControl('');

  setNew(dir: 'prev' | 'next'): void {
    if (this.weekly) {
      this.displayDate.setValue(
        getWeekDayDate(this.baseDay, dir, this.displayDate.value)
      );
    } else {
      const currVal: Date = this.displayDate.value;
      const multipl = dir === 'prev' ? -1 : 1;
      this.displayDate.setValue(
        new Date(currVal.getTime() + 1000 * 60 * 60 * 24 * multipl)
      );
    }
  }

  onDateChange(date: any): void {
    console.log('RUNNING ON CHANGE');
    if (!date) {
      return;
    }
    const refDate = new Date(date);
    refDate.setHours(0, 0, 0, 0);

    if (refDate !== this.displayDate.value) {
      const day = refDate.getDay();
      let offsetDate;

      if (this.weekly && day !== this.baseDay) {
        offsetDate = getWeekDayDate(this.baseDay, 'prev', refDate);
      } else {
        offsetDate = refDate;
      }
      this.dateChangeEvent.emit(offsetDate);
    }
  }

  constructor() {}

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dateVal'].currentValue !== this.displayDate.value) {
      const newDate = new Date(changes['dateVal'].currentValue);
      const dayOfWeek = newDate.getDay();
      newDate.setHours(0, 0, 0, 0);

      console.log({
        changes,
        weekly: this.weekly,
        baseDay: this.baseDay,
        dayOfWeek,
      });

      if (this.weekly && this.baseDay !== dayOfWeek) {
        const dayDiff = dayOfWeek - this.baseDay;
        if (dayDiff >= 1 && dayDiff <= 2) {
          this.displayDate.setValue(
            getWeekDayDate(this.baseDay, 'prev', newDate)
          );
        } else {
          this.displayDate.setValue(
            getWeekDayDate(this.baseDay, 'next', newDate)
          );
        }
        return;
      }

      this.displayDate.setValue(newDate);
    }
  }
}
