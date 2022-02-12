import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ProjectEntryComponent } from './project-entry.component';
import { TypeaheadService } from 'src/app/shared-module/typeahead.service';
import { DragAndDropService } from 'src/app/shared-module/drag-and-drop.service';
import { AllocateService } from 'src/app/shared-module/allocate.service';
import { Project } from 'src/app/project-list/project-list/project';
import { ConfigService } from 'src/app/shared-module/config.service';
import { dummyConfig } from 'src/app/shared-module/fetch.service.spec';
import { of } from 'rxjs';
import {
  getNewWeek,
  getDaysLeft,
  Week,
} from 'src/app/shared-module/week-days/week';
import { projectData } from 'src/app/utils/dummyData';

const configStub = {
  setConfig() {},
  updateConfig() {},
  onConfig: of(dummyConfig),
};

const ID = 'COMPONENT_ID';

describe('ProjectEntryComponent', () => {
  let component: ProjectEntryComponent;
  let fixture: ComponentFixture<ProjectEntryComponent>;
  let spyAllocate: jasmine.SpyObj<AllocateService>;
  let spyDragAndDrop: jasmine.SpyObj<DragAndDropService>;
  let config: ConfigService;

  beforeEach(async () => {
    const spyAll = jasmine.createSpyObj('AllocateService', [
      'registerAllocation',
    ]);
    const spyDD = jasmine.createSpyObj('DragAndDropService', ['onDragStart']);

    const typeaheadStub = {
      getTagByVal() {},
      getTypeahead() {},
    };

    await TestBed.configureTestingModule({
      declarations: [ProjectEntryComponent],
      providers: [
        { provide: TypeaheadService, useValue: typeaheadStub },
        { provide: AllocateService, useValue: spyAll },
        { provide: DragAndDropService, useValue: spyDD },
        {
          provide: ConfigService,
          useValue: configStub,
        },
      ],
      imports: [BrowserAnimationsModule],
    }).compileComponents();

    spyAllocate = TestBed.inject(
      AllocateService
    ) as jasmine.SpyObj<AllocateService>;
    spyDragAndDrop = TestBed.inject(
      DragAndDropService
    ) as jasmine.SpyObj<DragAndDropService>;
    config = TestBed.inject(ConfigService);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectEntryComponent);
    component = fixture.componentInstance;
    component.id = ID;
    component.entryData = projectData[0];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('emits edit event', () => {
    spyOn(component.editEvent, 'emit');
    component.handleEdit();
    expect(component.editEvent.emit).toHaveBeenCalledWith(ID);
  });

  it('emits delete event', () => {
    spyOn(component.deleteEvent, 'emit');
    component.handleDelete();
    expect(component.deleteEvent.emit).toHaveBeenCalledWith(ID);
  });

  it('emits calendar change event', () => {
    const cal: Week = getNewWeek();
    spyOn(component.calendarChangeEvent, 'emit');
    component.onCalendarChange(cal);
    expect(component.calendarChangeEvent.emit).toHaveBeenCalledWith({
      calendarObj: cal,
      id: component.id,
    });
  });

  it('register allocation', () => {
    component.onAllocation('e');

    expect(spyAllocate.registerAllocation).toHaveBeenCalled();
  });

  it('call d&d service on drag', () => {
    component.handleDragStart('e');

    expect(spyDragAndDrop.onDragStart).toHaveBeenCalled();
  });
});
