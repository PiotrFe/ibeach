import { TestBed } from '@angular/core/testing';

import { ListEditModeStatusService } from './list-edit-mode-status.service';

describe('ListEditModeStatusService', () => {
  let service: ListEditModeStatusService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ListEditModeStatusService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
