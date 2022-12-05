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
import { getWeekDayDate } from 'src/app/utils';
import { ListEditModeStatusService } from 'src/app/shared-module/list-edit-mode-status.service';
import { createModalAction } from 'src/app/shared-module/modal-window/modal-window.component';

defineLocale('uk', enGbLocale);

@Component({
  selector: 'calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
})
export class CalendarComponent implements OnInit, OnChanges {
  @Input() scrollable: boolean = false;
  @Input() contained: boolean = false;
  @Input() weekly: boolean = false;
  @Input() showError: boolean = false;
  @Input() baseDay: number = 1;
  @Input() dateVal!: Date;
  @Input() isSmall: boolean = false;
  @Input() showRange: boolean = false;
  @Input() askToConfirmDateChange: boolean = false;
  @Input() placement: 'left' | 'top' | 'bottom' | 'right' = 'bottom';
  @Input() disabled: boolean = false;

  @Output() dateChangeEvent = new EventEmitter<Date>();
  @Output() rangeChangeEvent = new EventEmitter<[Date, Date]>();

  showConfirmLeaveModal: boolean = false;
  displayDate = new FormControl('');

  modalAction!: { resolve: Function; reject: Function; wait: Function };
  modalPromise!: Promise<any>;
  currDate!: Date;
  bsRangeValue: Date[] = [];

  constructor(
    private localeService: BsLocaleService,
    private listEditModeStatusService: ListEditModeStatusService
  ) {}

  setNew(dir: 'prev' | 'next') {
    let date;
    if (this.weekly) {
      date = getWeekDayDate(this.baseDay, dir, this.displayDate.value);
    } else {
      const currVal: Date = this.displayDate.value;
      const multipl = dir === 'prev' ? -1 : 1;
      date = new Date(currVal.getTime() + 1000 * 60 * 60 * 24 * multipl);
    }
    this.onDateChange(date);
  }

  onRangeChange(event: any) {
    const [from, to] = event as Array<Date>;

    if (!from || !to) {
      return;
    }
    this.rangeChangeEvent.emit([
      new Date(from.setHours(0, 0, 0, 0)),
      new Date(to.setHours(0, 0, 0, 0)),
    ]);
  }

  async onDateChange(date: any) {
    if (!date) {
      return;
    }

    if (date === this.currDate) {
      return;
    }
    try {
      await this._canProceedWithDateChange();
    } catch (e) {
      this.displayDate.setValue(this.currDate);
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
      if (this.askToConfirmDateChange) {
        this.listEditModeStatusService.onRefDateChange();
      }
      this.currDate = offsetDate;
      this.dateChangeEvent.emit(offsetDate);
    }
  }

  ngOnInit(): void {
    this.localeService.use('uk');
  }

  ngOnChanges(changes: SimpleChanges): void {
    // if (this.contained) {
    //   return;
    // }

    const newDate = new Date(changes['dateVal'].currentValue);
    if (
      newDate &&
      !isNaN(newDate?.getTime()) &&
      newDate !== this.displayDate.value
    ) {
      newDate.setHours(0, 0, 0, 0);

      if (!this.contained) {
        const dayOfWeek = newDate.getDay();

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
      }

      this.displayDate.setValue(newDate);
    }
  }

  handleModalClose(submit: boolean) {
    this.showConfirmLeaveModal = false;
    if (submit) {
      this.modalAction.resolve();
    } else {
      this.modalAction.reject();
    }
  }

  _canProceedWithDateChange(): Promise<any> {
    if (
      !this.askToConfirmDateChange ||
      !this.listEditModeStatusService.isEditModeOpen()
    ) {
      return Promise.resolve();
    }

    this.modalAction = createModalAction();
    this.modalPromise = this.modalAction.wait();
    this.showConfirmLeaveModal = true;

    return this.modalPromise;
  }
}
