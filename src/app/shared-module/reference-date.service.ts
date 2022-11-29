import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { Week, getDaysLeft } from 'src/app/shared-module/week-days/week';
import { isDayInPast } from 'src/app/shared-module/week-days/week-days.component';

type ReferenceDateEntry = {
  referenceDate?: Date;
  excludePast?: boolean;
};

@Injectable({
  providedIn: 'root',
})
export class ReferenceDateService {
  excludePast: boolean = false;
  referenceDate: Date = new Date();

  #referenceChangeSubject$: ReplaySubject<ReferenceDateEntry> =
    new ReplaySubject<ReferenceDateEntry>();

  onReferenceDateChange$ = this.#referenceChangeSubject$.asObservable();

  constructor() {}

  onDateChange(newDate: Date) {
    const dateCopy = newDate;
    dateCopy.setHours(0, 0, 0, 0);
    this.referenceDate = dateCopy;
    this.#referenceChangeSubject$.next({
      referenceDate: dateCopy,
    });
  }

  onExcludePastChange(newExclude: boolean) {
    this.excludePast = newExclude;

    this.#referenceChangeSubject$.next({
      excludePast: newExclude,
    });
  }

  isPastDay(day: keyof Week) {
    return (
      this.excludePast &&
      this.referenceDate &&
      isDayInPast(day, this.referenceDate)
    );
  }
}
