import { TestBed } from '@angular/core/testing';

import { ReferenceDateService } from './reference-date.service';

describe('ReferenceDateService', () => {
  let service: ReferenceDateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReferenceDateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
