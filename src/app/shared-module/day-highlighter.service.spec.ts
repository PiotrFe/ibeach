import { TestBed, tick, fakeAsync, flush } from '@angular/core/testing';

import { DayHighlighterService } from './day-highlighter.service';

describe('DayHighlighterService', () => {
  let service: DayHighlighterService;
  let elem!: HTMLElement;

  beforeAll(() => {});

  beforeEach(() => {
    elem = document.createElement('div');
    elem.id = 'elemID';

    const calendar = document.createElement('div');
    calendar.classList.add('section-days');

    const day = document.createElement('div');
    day.classList.add('cal-entry--mon');

    document.documentElement.appendChild(elem);
    elem.appendChild(calendar);
    calendar.appendChild(day);

    TestBed.configureTestingModule({});
    service = TestBed.inject(DayHighlighterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // it('should highlight calendar day after 200ms', fakeAsync(() => {
  //   const child = elem.querySelector('.cal-entry--mon');
  //   service.highlight('elemID', 'mon');
  //   tick(250);
  //   expect(child?.classList).toContain('cal-entry--illegal');
  // }));

  // it('should highlight day count after 200ms', fakeAsync(() => {
  //   const child = elem.querySelector('.section-days');
  //   service.highlight('elemID', 'match');
  //   tick(250);
  //   expect(child?.classList).toContain('cal-entry--illegal');
  //   flush();
  // }));
});
