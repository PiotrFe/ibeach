import { TestBed } from '@angular/core/testing';

import { DayHighlighterService } from './day-highlighter.service';

describe('DayHighlighterService', () => {
  let service: DayHighlighterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DayHighlighterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
