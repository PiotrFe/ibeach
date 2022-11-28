import { TestBed } from '@angular/core/testing';

import { RefreshNowTsService } from './refresh-now-ts.service';

describe('RefreshNowTsService', () => {
  let service: RefreshNowTsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RefreshNowTsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
