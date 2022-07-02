import { TestBed } from '@angular/core/testing';

import { IsOnlineService } from './is-online.service';

describe('IsOnlineService', () => {
  let service: IsOnlineService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IsOnlineService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
