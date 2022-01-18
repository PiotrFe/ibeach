import { TestBed } from '@angular/core/testing';

import { DragAndDropService } from './drag-and-drop.service';

import { AllocateService } from 'src/app/shared-module/allocate.service';

describe('DragAndDropService', () => {
  let service: DragAndDropService;

  beforeEach(() => {
    const spyAllocate = jasmine.createSpyObj('AllocateService', [
      'registerDragEvent',
    ]);
    TestBed.configureTestingModule({
      providers: [{ provide: AllocateService, useValue: spyAllocate }],
    });
    service = TestBed.inject(DragAndDropService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
