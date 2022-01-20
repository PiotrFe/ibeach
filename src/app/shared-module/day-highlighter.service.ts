import { Injectable } from '@angular/core';
import { Week } from 'src/app/shared-module/week-days/week';

@Injectable({
  providedIn: 'root',
})
export class DayHighlighterService {
  constructor() {}

  highlight(entryID: string, day: keyof Week | 'match'): void {
    const entry = document.getElementById(`${entryID}`);
    const elemToHighlight =
      day === 'match'
        ? entry?.querySelector('.section-days')
        : entry?.querySelector(`.cal-entry--${day}`);

    if (!elemToHighlight) {
      return;
    }
    elemToHighlight.scrollIntoView({ block: 'nearest' });
    setTimeout(() => {
      elemToHighlight.classList.add('cal-entry--illegal');
      debugger;
      setTimeout(() => {
        elemToHighlight.classList.remove('cal-entry--illegal');
      }, 1500);
    }, 200);
  }
}
