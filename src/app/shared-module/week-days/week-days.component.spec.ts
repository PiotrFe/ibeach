import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllocateService } from 'src/app/shared-module/allocate.service';
import { DragAndDropService } from '../drag-and-drop.service';

import { WeekDaysComponent } from './week-days.component';
import { FirstInitialPipe } from 'src/app/shared-module/first-initial.pipe';
import { ProjectNamePipe } from 'src/app/shared-module/project-name.pipe';

describe('WeekDaysComponent', () => {
  let component: WeekDaysComponent;
  let fixture: ComponentFixture<WeekDaysComponent>;

  beforeEach(async () => {
    const spyAllocate = jasmine.createSpyObj('AllocateService', [
      'getDataForDay',
    ]);

    const spyDragAndDrop = jasmine.createSpyObj('DragAndDropService', [
      'onDragStart',
    ]);

    await TestBed.configureTestingModule({
      declarations: [WeekDaysComponent, FirstInitialPipe, ProjectNamePipe],
      providers: [
        { provide: AllocateService, useValue: spyAllocate },
        { provide: DragAndDropService, useValue: spyDragAndDrop },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WeekDaysComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
