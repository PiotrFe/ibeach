import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgZone } from '@angular/core';
import {
  ResizeObserverService,
  ResizeObserverServiceMock,
} from 'src/app/shared-module/resize-observer.service';
import { TypeaheadService, TypeaheadServiceMock } from '../typeahead.service';

import { PageComponent } from './page.component';
import { PersonEditable } from 'src/app/people-list/person';
import { getNewWeek } from 'src/app/shared-module/week-days/week';

const resizeObserverService = new ResizeObserverServiceMock();
const mockNgZone = jasmine.createSpyObj('mockNgZone', ['']);
const mockTypeAhead = new TypeaheadServiceMock();

describe('PageComponent', () => {
  let component: PageComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PageComponent],
      providers: [
        { provide: ResizeObserverService, useValue: resizeObserverService },
        { provide: TypeaheadService, useValue: mockTypeAhead },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    component = new PageComponent(
      mockNgZone,
      resizeObserverService,
      mockTypeAhead
    );
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should update filters', () => {
    const CURR_FILTER = {
      field: 'skill',
      value: 'ASC',
    };
    const NEW_FILTER = {
      field: 'avail',
      value: 'yes',
    };
    const ALL_FILTER = {
      field: 'All',
      value: 'yes',
    };
    component.filters = [{ ...CURR_FILTER }];

    component.updateFilter(NEW_FILTER.field, NEW_FILTER.value);
    expect(component.filters[1]).toEqual(NEW_FILTER);

    component.updateFilter(NEW_FILTER.field, NEW_FILTER.value);
    expect(component.filters.length).toBe(2);

    component.updateFilter(ALL_FILTER.field, ALL_FILTER.value);
    expect(component.filters.length).toBe(2);
  });

  it('show available records only if toggled on', () => {
    component.showAvailableOnly = false;
    spyOn(component, 'updateFilteredView');

    component.toggleShowAvailableOnly();

    expect(component.showAvailableOnly).toBeTrue();
    expect(component.filters.length).toBe(1);
    expect(component.filters[0].field).toBe('days');
    expect(component.updateFilteredView).toHaveBeenCalled();
  });

  describe('Filters', () => {
    let data: any[] = [];

    beforeEach(() => {
      data = [
        { daysLeft: 4, pdm: 'John Smith', skill: 'asc' },
        { daysLeft: 0, pdm: 'John Smith', skill: 'ba' },
        { daysLeft: 4, pdm: 'Marie Smith', skill: 'em' },
      ];
    });

    it('removes unavailable people', () => {
      component.filters = [{ field: 'days' }];

      const updatedData = component.getFilteredView(data);
      const index = updatedData.findIndex((entry) => entry.daysLeft === 0);

      expect(updatedData.length).toBe(2);
      expect(index).toBe(-1);
    });

    it('filters by PDM', () => {
      component.filters = [{ field: 'pdm', value: 'Marie Smith' }];

      const updatedData = component.getFilteredView(data);
      const index = updatedData.findIndex(
        (entry) => entry.pdm === 'John Smith'
      );
      const existingIndex = updatedData.findIndex(
        (entry) => entry.pdm === 'Marie Smith'
      );

      expect(updatedData.length).toBe(1);
      expect(index).toBe(-1);
      expect(existingIndex).toBe(0);
    });

    it('filters by skill', () => {
      component.filters = [{ field: 'skill', value: 'ba' }];

      const updatedData = component.getFilteredView(data);
      const index = updatedData.findIndex((entry) => entry.skill === 'em');

      const existingIndex = updatedData.findIndex(
        (entry) => entry.skill === 'ba'
      );

      expect(updatedData.length).toBe(1);
      expect(index).toBe(-1);
      expect(existingIndex).toBe(0);
    });
  });

  describe('Classes', () => {
    it('returns clickable filter btn class if filters applied', () => {
      component.filters = [{ field: 'days' }];

      const classArr = component.getClearFilterBtnClass().split(' ');
      const idx = classArr.findIndex((className) => className === 'clickable');

      expect(idx).toBeGreaterThan(-1);
    });

    it('clickable inactive btn class if filters applied', () => {
      component.filters = [];

      const classArr = component.getClearFilterBtnClass().split(' ');
      const idx = classArr.findIndex(
        (className) => className === 'btn-inactive'
      );
      const nonExIdx = classArr.findIndex(
        (className) => className === 'clickable'
      );

      expect(idx).toBeGreaterThan(-1);
      expect(nonExIdx).toBe(-1);
    });
  });

  it('updates filteredDataset', () => {
    spyOn(component, 'getFilteredView');

    component.updateFilteredView();

    expect(component.getFilteredView).toHaveBeenCalled();
  });

  it('calls sortService', () => {
    const dataSet: any[] = [];
    const colName = 'name';
    component.dataSet = dataSet;
    component.sortService.sortData.bind(component);

    spyOn(component.sortService, 'sortData');
    spyOn(component, 'updateFilteredView');

    component.handleSort(colName);

    expect(component.sortService.sortData).toHaveBeenCalledOnceWith(
      dataSet,
      colName
    );
    expect(component.updateFilteredView).toHaveBeenCalled();
  });

  it('calls typeaheadSergice', () => {
    spyOn(component.typeaheadService, 'getTypeahead');

    component.getNameTypeAhead();
    expect(component.typeaheadService.getTypeahead).toHaveBeenCalled();
  });

  it('toggles editMode', () => {
    component.setInEditMode(true);
    expect(component.inEditMode).toBeTrue();

    component.setInEditMode(false);
    expect(component.inEditMode).toBeFalse();
    expect(component.newRows.length).toBe(0);
  });

  describe('Dataset edits', () => {
    let person1: PersonEditable,
      person2: PersonEditable,
      person3: PersonEditable;

    beforeEach(() => {
      person1 = {
        id: 'a',
        name: 'Peter Jacson',
        skill: 'asc',
        week: getNewWeek(),
        daysLeft: 5,
        inEditMode: false,
        tags: [],
      };
      person2 = {
        id: 'b',
        name: 'Mary Jackson',
        skill: 'asc',
        week: getNewWeek(),
        daysLeft: 5,
        inEditMode: true,
        tags: [],
      };
      person3 = {
        id: 'c',
        name: 'George Jackson',
        skill: 'em',
        week: getNewWeek(),
        daysLeft: 5,
        inEditMode: true,
        tags: [{ type: 'ind', value: 'ai' }],
      };
    });
    it('checks if rows are open', () => {
      let formsAreOpen: boolean;
      component.dataSet = [person1, person3];
      component.newRows = [person2];

      formsAreOpen = component.checkIfAnyFormsOpen();
      expect(formsAreOpen).toBeTrue();

      person3.inEditMode = false;
      component.newRows = [];

      formsAreOpen = component.checkIfAnyFormsOpen();
      expect(formsAreOpen).toBeFalse();
    });

    it('removes a row', () => {
      component.newRows = [person2];
      component.removeRow('b');

      expect(component.newRows.length).toBe(0);
    });

    it('sets a row to edit mode', () => {
      spyOn(component, 'updateFilteredView');

      component.dataSet = [person1];

      component.editRow('a');
      expect(component.dataSet[0].inEditMode).toBeTrue();
      expect(component.updateFilteredView).toHaveBeenCalled();
    });

    it('updated entry calendar', () => {
      const calendar = getNewWeek();
      component.dataSet = [person1, person2, person3];

      spyOn(component, 'updateFilteredView');

      component.updateCalendar({ id: 'a', calendarObj: calendar });

      expect(component.dataSet[0].week).toEqual(calendar);
      expect(component.updateFilteredView).toHaveBeenCalled();
    });

    it('updates tags', () => {
      const tag = {
        type: 'ind',
        value: 'org',
      };
      component.dataSet = [person1, person2, person3];

      component.updateTags({
        id: 'a',
        value: tag.value,
        type: tag.type,
        action: 'add',
      });

      expect(component.dataSet[0].tags.length).toBe(1);
      expect(component.dataSet[0].tags[0].value).toBe('org');

      expect(component.dataSet[2].tags.length).toBe(1);

      component.updateTags({
        id: 'c',
        value: 'ind',
        type: 'ai',
        action: 'remove',
      });
      expect(component.dataSet[2].tags.length).toBe(0);
    });

    it('updates data and dataset on date change', () => {
      const date = new Date();
      const dateMidnight = new Date(date);
      dateMidnight.setHours(0, 0, 0, 0);

      component.onDateChange(date);
      expect(component.referenceDate.getTime()).toBe(dateMidnight.getTime());
      expect(component.dataSet.length).toBe(0);
    });

    it('toggles all entries to edit mode false on cancel changes', () => {
      component.dataSet = [person1, person2, person3];

      component.onCancelChanges();

      expect(component.dataSet[1].inEditMode).toBeFalse();
      expect(component.dataSet[2].inEditMode).toBeFalse();
    });
  });
});
