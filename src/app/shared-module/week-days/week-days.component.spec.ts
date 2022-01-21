import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllocateService } from 'src/app/shared-module/allocate.service';
import { DragAndDropService } from 'src/app/shared-module/drag-and-drop.service';

import { WeekDaysComponent } from './week-days.component';
import { FirstInitialPipe } from 'src/app/shared-module/first-initial.pipe';
import { ProjectNamePipe } from 'src/app/shared-module/project-name.pipe';
import { getNewWeek, Week } from 'src/app/shared-module/week-days/week';
import { By } from '@angular/platform-browser';
import { Component } from '@angular/core';

@Component({
  template: `<week-days
    [id]="id"
    [weekObj]="weekObj"
    [displayedIn]="displayedIn"
    [inEditMode]="inEditMode"
  ></week-days>`,
})
class TestHostComponent {
  id: string = 'abc';
  weekObj!: Week;
  displayedIn: 'people' | 'projects' = 'people';
  inEditMode: boolean = false;

  constructor() {
    const weekObj = getNewWeek();
    weekObj.mon = { id: '1', text: 'cool project' };
    weekObj.tue = { id: '2', text: 'Mark Twain' };
    weekObj.wed = false;

    this.weekObj = weekObj;
  }
}

const spyAllocate = jasmine.createSpyObj('AllocateService', ['getDataForDay']);

const spyDragAndDrop = jasmine.createSpyObj('DragAndDropService', [
  'onDragStart',
]);

describe('WeekDaysComponent', () => {
  let component: WeekDaysComponent;
  let fixture: ComponentFixture<WeekDaysComponent>;

  beforeEach(async () => {
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
    component.id = 'abc';
    component.weekObj = getNewWeek();
    component.weekDaysArr = Object.keys(component.weekObj).map((val) => ({
      type: 'avail',
      day: val as keyof Week,
      value: {
        id: null,
        text: val,
      },
    }));
    component.weekDaysArr[4].type = 'away';
    component.inEditMode = false;
    component.droppable = false;
    component.displayedIn = 'people';

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('displays week days if no allocation', () => {
    const idArr = ['#abc__0', '#abc__1', '#abc__2', '#abc__3', '#abc__4'];
    const elemArr = [];

    for (let id of idArr) {
      const elem: HTMLElement = fixture.debugElement.query(
        By.css(id)
      ).nativeElement;
      elemArr.push(elem);
    }

    expect(elemArr[0].textContent).toBe('Mon');
    expect(elemArr[1].textContent).toBe('Tue');
    expect(elemArr[2].textContent).toBe('Wed');
    expect(elemArr[3].textContent).toBe('Thu');
    expect(elemArr[4].textContent).toBe('Fri');
  });

  it('emits allocation event on allocation via dropdown', () => {
    component.allocatedTo.setValue('test client');
    component.dropdownList = [
      { id: '1', value: 'best client' },
      { id: '2', value: 'test client' },
    ];
    component.showDropdownAtDay = 'mon';

    spyOn(component.allocation, 'emit');

    component.onDropdownSubmit();

    expect(component.allocation.emit).toHaveBeenCalledWith({
      id: '2',
      value: 'test client',
      day: 'mon',
    });
  });

  it('Ignores click on inactive buttons if not in edit mode', () => {
    spyOn(component.calendarChange, 'emit');

    component.handleBtnClick(4);
    expect(component.calendarChange.emit).not.toHaveBeenCalled();
  });

  it('emits calendarChangeEvent when clicked on a button in edit mode', () => {
    spyOn(component.calendarChange, 'emit');

    component.inEditMode = true;
    component.handleBtnClick(3);
    expect(component.calendarChange.emit).toHaveBeenCalled();
  });
});

describe('WeekDay component in a host', () => {
  let testHost: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        TestHostComponent,
        WeekDaysComponent,
        FirstInitialPipe,
        ProjectNamePipe,
      ],
      providers: [
        { provide: AllocateService, useValue: spyAllocate },
        { provide: DragAndDropService, useValue: spyDragAndDrop },
      ],
    });
    fixture = TestBed.createComponent(TestHostComponent);
    testHost = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('displays project name', () => {
    const projectElem: HTMLElement = fixture.debugElement.query(
      By.css('#abc__0')
    ).nativeElement;

    expect(projectElem.textContent).toBe('cool project');
  });

  it('displays person name', () => {
    testHost.displayedIn = 'projects';
    fixture.detectChanges();

    const projectElem: HTMLElement = fixture.debugElement.query(
      By.css('#abc__1')
    ).nativeElement;

    expect(projectElem.textContent).toBe('M Twain');
  });
});
