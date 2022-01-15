import { Injectable } from '@angular/core';
import { Week } from 'src/app/shared-module/week-days/week';

@Injectable({
  providedIn: 'root',
})
export class DayHighlighterService {
  constructor() {}

  highlight(entryID: string, day: keyof Week): void {
    console.log({ entryID, day });

    const entry = document.getElementById(`${entryID}`);
    const dayBtn = entry?.querySelector(`.cal-entry--${day}`);
    if (!dayBtn) {
      return;
    }
    dayBtn.scrollIntoView({ block: 'nearest' });
    setTimeout(() => {
      dayBtn.classList.add('cal-entry--illegal');
      setTimeout(() => {
        dayBtn.classList.remove('cal-entry--illegal');
      }, 1500);
    }, 200);
  }
}
