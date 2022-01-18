import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PersonEntryComponent } from './person-entry.component';
import { TypeaheadService } from 'src/app/shared-module/typeahead.service';
import {
  AllocateService,
  AllocationEntry,
} from 'src/app/shared-module/allocate.service';
import { DragAndDropService } from 'src/app/shared-module/drag-and-drop.service';
import {
  Week,
  getNewWeek,
  getDaysLeft,
} from 'src/app/shared-module/week-days/week';
import { PersonEditable } from '../person';

describe('PersonEntryComponent', () => {
  let component: PersonEntryComponent;
  let fixture: ComponentFixture<PersonEntryComponent>;
  let person: PersonEditable;

  beforeEach(async () => {
    const spyAllocate = jasmine.createSpyObj('AllocateService', [
      'registerAllocation',
    ]);
    const spyDragAndDrop = jasmine.createSpyObj('DragAndDropService', [
      'onDragStart',
    ]);

    const week = getNewWeek();

    person = {
      id: '123',
      name: 'Peter',
      skill: 'ASC',
      pdm: 'John Smith',
      availDate: new Date(),
      week,
      daysLeft: getDaysLeft(week),
      comments: '',
      tags: [],
      inEditMode: false,
    };

    await TestBed.configureTestingModule({
      declarations: [PersonEntryComponent],
      providers: [
        TypeaheadService,
        { provide: AllocateService, useValue: spyAllocate },
        { provide: DragAndDropService, useValue: spyDragAndDrop },
      ],
      imports: [BrowserAnimationsModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PersonEntryComponent);
    component = fixture.componentInstance;
    component.entryData = person;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
