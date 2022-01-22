import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PersonEntryComponent } from './person-entry.component';
import { TypeaheadService } from 'src/app/shared-module/typeahead.service';
import {
  AllocateService,
  AllocationEntry,
} from 'src/app/shared-module/allocate.service';
import { DragAndDropService } from 'src/app/shared-module/drag-and-drop.service';
import { Max25charsPipe } from 'src/app/shared-module/max25chars.pipe';
import { InitialsPipe } from 'src/app/shared-module/initials.pipe';
import {
  Week,
  getNewWeek,
  getDaysLeft,
} from 'src/app/shared-module/week-days/week';
import { PersonEditable } from '../person';
import { personData, projectData } from 'src/app/utils/dummyData';
import { DebugElement } from '@angular/core';

describe('PersonEntryComponent', () => {
  let component: PersonEntryComponent;
  let fixture: ComponentFixture<PersonEntryComponent>;
  let person: PersonEditable;
  let allocateService: jasmine.SpyObj<AllocateService>;
  let dragAndDropService: jasmine.SpyObj<DragAndDropService>;

  beforeEach(async () => {
    const spyAllocate = jasmine.createSpyObj('AllocateService', [
      'registerAllocation',
    ]);
    const spyDragAndDrop = jasmine.createSpyObj('DragAndDropService', [
      'onDragStart',
    ]);

    await TestBed.configureTestingModule({
      declarations: [PersonEntryComponent, Max25charsPipe, InitialsPipe],
      providers: [
        TypeaheadService,
        { provide: AllocateService, useValue: spyAllocate },
        { provide: DragAndDropService, useValue: spyDragAndDrop },
      ],
      imports: [BrowserAnimationsModule],
    }).compileComponents();

    allocateService = TestBed.inject(
      AllocateService
    ) as jasmine.SpyObj<AllocateService>;

    dragAndDropService = TestBed.inject(
      DragAndDropService
    ) as jasmine.SpyObj<DragAndDropService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PersonEntryComponent);
    component = fixture.componentInstance;
    component.entryData = personData[0];
    component.id = 'comp_id';
    component.entryContainerWidth = 4;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('emits edit event', () => {
    spyOn(component.editEvent, 'emit');
    component.handleEdit();
    expect(component.editEvent.emit).toHaveBeenCalled();
  });

  it('emits delete event', () => {
    spyOn(component.deleteEvent, 'emit');
    component.handleDelete();
    expect(component.deleteEvent.emit).toHaveBeenCalled();
  });

  it('emits calendar change event', () => {
    spyOn(component.calendarChangeEvent, 'emit');
    component.onCalendarChange(getNewWeek());
    expect(component.calendarChangeEvent.emit).toHaveBeenCalled();
  });

  it('calls allocation service to register allocation', () => {
    const projectID: string = 'pro_id';
    const projectName: string = 'cool project';
    const day: keyof Week = 'tue';

    const allocationEvent = {
      id: projectID,
      value: projectName,
      day,
    };

    const allocationEntry: AllocationEntry = {
      project: {
        id: projectID,
        value: projectName,
      },
      person: {
        id: component.person.id,
        value: component.person.name,
      },
      day,
    };

    component.onAllocation(allocationEvent);

    expect(allocateService.registerAllocation).toHaveBeenCalledOnceWith(
      component.referenceDate,
      allocationEntry
    );
  });

  it('calls drag and drop service on drag start', () => {
    const DRAG_EVENT = 'drag_event';
    component.handleDragStart(DRAG_EVENT);

    expect(dragAndDropService.onDragStart).toHaveBeenCalledWith(
      DRAG_EVENT,
      component.id,
      'match',
      'people'
    );
  });

  it('properly displays template contents', () => {
    const entryDe: DebugElement = fixture.debugElement;
    const entryEl: HTMLElement = entryDe.nativeElement;

    const nameSpan = entryEl.querySelector(`#${component.id}__name`);
    const skillSpan = entryEl.querySelector(`.section-skill`);
    const daysSpan = entryEl.querySelector(`.section-days`);
    const pdmSpan = entryEl.querySelector(`.section-pdm`);
    const commentsSpan = entryEl.querySelector(`.section-comments`);

    expect(nameSpan?.textContent).toBe('Peter Smith');
    expect(skillSpan?.textContent).toBe('manager');
    expect(daysSpan?.textContent).toBe('5');
    expect(pdmSpan?.textContent).toBe('JW');
    expect(commentsSpan?.textContent).toBe('Comment on Peter');
  });
});
