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
import { BsLocaleService } from 'ngx-bootstrap/datepicker';
import { defineLocale } from 'ngx-bootstrap/chronos';
import { enGbLocale } from 'ngx-bootstrap/locale';
import { getWeekDayDate } from '../../utils';

defineLocale('uk', enGbLocale);

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
  @Input() isSmall: boolean = false;

  @Output() dateChangeEvent = new EventEmitter<Date>();

  displayDate = new FormControl('');

  constructor(private localeService: BsLocaleService) {}

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

  ngOnInit(): void {
    this.localeService.use('uk');
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dateVal'].currentValue !== this.displayDate.value) {
      const newDate = new Date(changes['dateVal'].currentValue);
      const dayOfWeek = newDate.getDay();
      newDate.setHours(0, 0, 0, 0);

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
