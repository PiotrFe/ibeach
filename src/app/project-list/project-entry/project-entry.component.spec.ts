import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ProjectEntryComponent } from './project-entry.component';
import { TypeaheadService } from 'src/app/shared-module/typeahead.service';
import { DragAndDropService } from 'src/app/shared-module/drag-and-drop.service';
import { AllocateService } from 'src/app/shared-module/allocate.service';
import { Project } from 'src/app/project-list/project-list/project';
import { getNewWeek, getDaysLeft } from 'src/app/shared-module/week-days/week';

describe('ProjectEntryComponent', () => {
  let component: ProjectEntryComponent;
  let fixture: ComponentFixture<ProjectEntryComponent>;
  let project: Project;

  beforeEach(async () => {
    const spyAllocate = jasmine.createSpyObj('AllocateService', [
      'registerAllocation',
    ]);
    const spyDragAndDrop = jasmine.createSpyObj('DragAndDropService', [
      'onDragStart',
    ]);

    const week = getNewWeek();

    project = {
      id: '123',
      client: 'test',
      type: 'LOP',
      availDate: new Date(),
      week,
      daysLeft: getDaysLeft(week),
      leadership: ['Tom Pain', 'Mary Baley'],
      comments: '',
      tags: [],
    };

    await TestBed.configureTestingModule({
      declarations: [ProjectEntryComponent],
      providers: [
        TypeaheadService,
        { provide: AllocateService, useValue: spyAllocate },
        { provide: DragAndDropService, useValue: spyDragAndDrop },
      ],
      imports: [BrowserAnimationsModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectEntryComponent);
    component = fixture.componentInstance;
    component.entryData = project;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
