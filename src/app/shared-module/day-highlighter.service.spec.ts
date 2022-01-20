import {
  TestBed,
  ComponentFixture,
  tick,
  fakeAsync,
  flush,
} from '@angular/core/testing';
import { WeekDaysComponent } from 'src/app/shared-module/week-days/week-days.component';
import { DayHighlighterService } from 'src/app/shared-module/day-highlighter.service';
import { AllocateService } from 'src/app/shared-module/allocate.service';
import { getNewWeek } from 'src/app/shared-module/week-days/week';
import { DragAndDropService } from 'src/app/shared-module/drag-and-drop.service';
import { FirstInitialPipe } from 'src/app/shared-module/first-initial.pipe';
import { ProjectNamePipe } from 'src/app/shared-module/project-name.pipe';

const stubAllocate = {
  getDataForDay() {},
};

const stubDragAndDrop = {
  onDragStart() {},
};

describe('DayHighlighterService', () => {
  let service: DayHighlighterService;
  let fixture: ComponentFixture<WeekDaysComponent>;
  let component: WeekDaysComponent;

  beforeAll(() => {});

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [WeekDaysComponent, FirstInitialPipe, ProjectNamePipe],
      providers: [
        { provide: DragAndDropService, useValue: stubDragAndDrop },
        { provide: AllocateService, useValue: stubAllocate },
      ],
    }).compileComponents();

    service = TestBed.inject(DayHighlighterService);
    fixture = TestBed.createComponent(WeekDaysComponent);
    component = fixture.componentInstance;
    component.id = 'abc';
    component.weekObj = getNewWeek();
    component.droppable = false;
    component.displayedIn = 'people';

    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // TODO: do integration test with person-entry
  // it('should highlight calendar day after 200ms', fakeAsync(() => {
  //   service.highlight('abc', 'mon');
  //   tick(500);
  //   fixture.detectChanges();

  //   fixture.whenRenderingDone().then(() => {
  //     const elem =
  //       fixture.debugElement.nativeElement.querySelector('.weekday-list');
  //     debugger;
  //     const elemToHighlight = elem.querySelector('.cal-entry--mon');

  //     expect(elemToHighlight?.classList).toContain('cal-entry--illegal');
  //     debugger;
  //     flush();
  //   });
  // }));
});
