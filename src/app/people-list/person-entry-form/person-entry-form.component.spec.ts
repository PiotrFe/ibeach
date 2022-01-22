import { Component, DebugElement, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Person } from 'src/app/people-list/person';
import { getNewWeek } from 'src/app/shared-module/week-days/week';
import { PersonEntryFormComponent } from './person-entry-form.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { getWeekDayDate } from 'src/app/utils';

const refDate = new Date();
const person: Person = {
  id: 'a',
  name: 'Peter White',
  skill: 'EM',
  pdm: 'Andy Wahrol',
  week: getNewWeek(),
  daysLeft: 5,
  comments: 'Comments on Peter',
  tags: [],
};

@Component({
  template:
    "<person-entry-form [id]='id' [sortField]='sortField' [referenceDate]='referenceDate' [entryData]='person' [entryContainerWidth]='entryContainerWidth' [displayedIn]='displayedIn' [getNameTypeAhead]='getNameTypeAhead' [dispatchToParentAndClose]='dispatchToParentAndClose'></person-entry-form>",
})
class HostComponent {
  id: string = 'abc';
  sortField: string = 'name';
  referenceDate: Date = refDate;
  pdm: string = 'John Wayne';
  entryContainerWidth: number = 4;
  person: Person = person;
  displayedIn: string = 'ALLOCATE';
  getNameTypeAhead: Function = () => {};
  dispatchToParentAndClose: boolean = false;
}

@Component({
  selector: 'week-days',
  template: '',
})
class WeekDaysStub {}

describe('PersonEntryFormComponent', () => {
  let component: HostComponent;
  let fixture: ComponentFixture<HostComponent>;
  let formDE: DebugElement;
  let formEl: HTMLElement;

  describe('displays properties received from host', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        declarations: [HostComponent, WeekDaysStub, PersonEntryFormComponent],
        imports: [BrowserAnimationsModule, FormsModule, ReactiveFormsModule],
      }).compileComponents();
    });

    beforeEach(() => {
      fixture = TestBed.createComponent(HostComponent);
      component = fixture.componentInstance;

      fixture.detectChanges();

      formDE = fixture.debugElement;
      formEl = formDE.nativeElement;
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('receives properties from host', () => {
      const nameInput: HTMLInputElement | null =
        formEl.querySelector('.section-name');
      const skillInput: HTMLInputElement | null =
        formEl.querySelector('.section-skill');
      const daysLeftSpan: HTMLElement | null =
        formEl.querySelector('.section-days');

      const commentsInput: HTMLInputElement | null =
        formEl.querySelector('.section-comments');

      expect(nameInput?.value).toBe('Peter White');
      expect(skillInput?.value).toBe('EM');
      expect(daysLeftSpan?.textContent).toBe('5');
      expect(commentsInput?.value).toBe('Comments on Peter');
    });
  });

  describe('standalone functionality', () => {
    let component: PersonEntryFormComponent;
    let fixture: ComponentFixture<PersonEntryFormComponent>;
    let formDE: DebugElement;
    let formEl: HTMLElement;

    beforeEach(() => {
      TestBed.configureTestingModule({
        declarations: [WeekDaysStub, PersonEntryFormComponent],
        imports: [BrowserAnimationsModule, FormsModule, ReactiveFormsModule],
      }).compileComponents();
    });

    beforeEach(() => {
      fixture = TestBed.createComponent(PersonEntryFormComponent);
      component = fixture.componentInstance;
      component.getNameTypeAhead = () => {};
      component.displayedIn = 'ALLOCATE';
      component.entryContainerWidth = 4;

      fixture.detectChanges();

      formDE = fixture.debugElement;
      formEl = formDE.nativeElement;
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should start uncollapsed when displayed in allocate section', () => {
      expect(component.isCollapsed).toBeFalse();
    });

    describe('should update and proplerly display form values', () => {
      it('initiates with correct form values', () => {
        const form = component.personForm;
        const expectedValues = {
          name: '',
          skill: 'skill',
          availDate: undefined,
          comments: '',
          pdm: 'pdm',
        };
        expect(form.value).toEqual(expectedValues);
      });
      it('updates template based on form values', () => {
        component.personForm.patchValue({
          name: 'John Wayne',
          skill: 'EM',
          comments: 'Comments on John',
        });
        fixture.detectChanges();

        const nameElem: HTMLInputElement | null =
          formEl.querySelector('.section-name');
        const skillElem: HTMLSelectElement | null =
          formEl.querySelector('.section-skill');
        const commentsElem: HTMLInputElement | null =
          formEl.querySelector('.section-comments');

        expect(nameElem?.value).toBe('John Wayne');
        expect(skillElem?.value).toBe('EM');
        expect(commentsElem?.value).toBe('Comments on John');
      });
    });

    it('runs form validation function if form invalid', () => {
      spyOn(component, 'validateFormFields');
      component.onSubmit();
      expect(component.validateFormFields).toHaveBeenCalled();
    });

    it('emits form submit event if form valid', () => {
      component.personForm.patchValue({
        name: 'John Wayne',
        skill: 'EM',
        availDate: new Date(),
        comments: 'Comments on John',
        pdm: 'Mary Small',
      });

      fixture.detectChanges();
      spyOn(component, 'validateFormFields');
      spyOn(component.formSubmitEvent, 'emit');
      component.onSubmit();
      expect(component.validateFormFields).not.toHaveBeenCalled();
      expect(component.formSubmitEvent.emit).toHaveBeenCalled();
    });

    it('updates displayed availability date', () => {
      const date = new Date();

      spyOn(component.personForm, 'patchValue');
      component.onDateChange(date);

      expect(component.personForm.patchValue).toHaveBeenCalledWith({
        availDate: date,
      });
    });

    it('updated displayed calendar', () => {
      const calendar = getNewWeek();
      component.referenceDate = new Date();

      spyOn(component.personForm, 'patchValue');
      component.onCalendarChange(calendar);

      expect(component.localCalendarObj).toEqual(calendar);
    });
  });
});
