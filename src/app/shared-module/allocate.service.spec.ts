import { TestBed } from '@angular/core/testing';
import {
  Project,
  ProjectEditable,
} from 'src/app/project-list/project-list/project';
import { Person, PersonEditable } from 'src/app/people-list/person';

import { DayHighlighterService } from 'src/app/shared-module/day-highlighter.service';
import { FetchService } from 'src/app/shared-module/fetch.service';
import {
  AllocateService,
  Dataset,
  DropdownEntry,
  AllocationEntry,
  AllocationDragDropEvent,
} from './allocate.service';
import { personData, projectData } from 'src/app/utils/dummyData';
import { of } from 'rxjs';

describe('AllocateService', () => {
  let service: AllocateService;
  let fetchServiceSpy: jasmine.SpyObj<FetchService>;
  let weekOf = new Date();

  beforeEach(() => {
    const spy = jasmine.createSpyObj('FetchService', [
      'handleError',
      'storeMasterList',
      'fetchWeeklyList',
      'saveList',
      'submitList',
      'fetchProjectList',
      'saveProjectList',
      'saveAllocationEntry',
    ]);
    const dayHiglighterSpy: jasmine.SpyObj<DayHighlighterService> =
      jasmine.createSpyObj('DayHighlighterService', ['highlight']);

    TestBed.configureTestingModule({
      providers: [
        AllocateService,
        { provide: FetchService, useValue: spy },
        { provide: DayHighlighterService, useValue: dayHiglighterSpy },
      ],
    });

    service = TestBed.inject(AllocateService);

    fetchServiceSpy = TestBed.inject(
      FetchService
    ) as jasmine.SpyObj<FetchService>;

    TestBed.inject(
      DayHighlighterService
    ) as jasmine.SpyObj<DayHighlighterService>;

    service.peopleDataSet = personData;
    service.projectDataSet = projectData;
    service.weekOf = weekOf;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('registers a dataset', () => {
    let peopleDataset: Dataset = {
      dataType: 'people',
      data: personData,
      weekOf: new Date(),
    };
    let projectDataset: Dataset = {
      dataType: 'projects',
      data: projectData,
      weekOf: new Date(),
    };
    service.peopleDataSet = [];
    service.projectDataSet = [];

    service.registerDataset(peopleDataset);
    service.registerDataset(projectDataset);

    expect(service.peopleDataSet).toEqual(
      peopleDataset.data as Array<PersonEditable>
    );
    expect(service.projectDataSet).toEqual(
      projectDataset.data as Array<ProjectEditable>
    );
    expect(service.weekOf).toEqual(peopleDataset.weekOf);
  });

  it('returns people available on particular day', () => {
    service.peopleDataSet[0].week.mon = false;

    const expectedReturn = [
      {
        id: service.peopleDataSet[1].id,
        value: service.peopleDataSet[1].name,
      },
      {
        id: service.peopleDataSet[2].id,
        value: service.peopleDataSet[2].name,
      },
    ];
    const actualReturn = service.getPeopleForDay('mon');

    expect(expectedReturn[0].id).toBe(actualReturn[0].id);
    expect(expectedReturn[0].value).toBe(actualReturn[0].value);
    expect(expectedReturn[1].id).toBe(actualReturn[1].id);
    expect(expectedReturn[1].value).toBe(actualReturn[1].value);
  });

  it('returns people available on particular day', () => {
    service.peopleDataSet[0].week.mon = false;

    const expectedReturn = [
      {
        id: service.peopleDataSet[1].id,
        value: service.peopleDataSet[1].name,
      },
      {
        id: service.peopleDataSet[2].id,
        value: service.peopleDataSet[2].name,
      },
    ];
    const actualReturn = service.getPeopleForDay('mon');

    expect(expectedReturn[0].id).toBe(actualReturn[0].id);
    expect(expectedReturn[0].value).toBe(actualReturn[0].value);
    expect(expectedReturn[1].id).toBe(actualReturn[1].id);
    expect(expectedReturn[1].value).toBe(actualReturn[1].value);
  });

  it('returns projects available on particular day', () => {
    service.projectDataSet[0].week.mon = false;

    const expectedReturn = [
      {
        id: service.projectDataSet[1].id,
        value: service.projectDataSet[1].client,
      },
      {
        id: service.projectDataSet[2].id,
        value: service.projectDataSet[2].client,
      },
    ];
    const actualReturn = service.getProjectsForDay('mon');

    expect(expectedReturn[0].id).toBe(actualReturn[0].id);
    expect(expectedReturn[0].value).toBe(actualReturn[0].value);
    expect(expectedReturn[1].id).toBe(actualReturn[1].id);
    expect(expectedReturn[1].value).toBe(actualReturn[1].value);
  });

  it('deletes a person record', () => {
    spyOn(service.deleteRecordSubject, 'next');

    service.handleDeleteRecord(service.peopleDataSet[0], 'people');

    expect(service.deleteRecordSubject.next).toHaveBeenCalled();
  });

  it('registers save event', () => {
    spyOn(service.deleteRecordSubject, 'next');

    service.registerSaveEvent(true, 'people');

    expect(service.deleteRecordSubject.next).toHaveBeenCalledWith({
      save: true,
      issuedBy: 'people',
    });
  });

  it('registers allocation', () => {
    const wrongDate = new Date();
    const allocationEntry: AllocationEntry = {
      person: {
        id: 'abc',
        value: 'Mike White',
      },
      project: {
        id: 'def',
        value: 'great stuff',
      },
      day: 'thu',
    };

    try {
      service.registerAllocation(wrongDate, allocationEntry);
    } catch (e: any) {
      expect(e.message).toBe('Date mismatch');
    }
    const saveEntry = fetchServiceSpy.saveAllocationEntry.and.returnValue(of());
    service.registerAllocation(weekOf, allocationEntry);
    expect(saveEntry).toHaveBeenCalledWith(weekOf, allocationEntry);
  });

  it('registers drag event', () => {
    const draggedItem = service.peopleDataSet[0];
    const dragData: AllocationDragDropEvent = {
      id: draggedItem.id,
      day: 'tue',
      elemType: 'people',
    };

    service.registerDragEvent(dragData);

    expect(service.registeredDragEvent?.id).toBe(draggedItem.id);
    expect(service.registeredDragEvent?.day).toBe('tue');
    expect(service.registeredDragEvent?.elemType).toBe('people');
    expect(service.registeredDragEvent?.draggable).toEqual(draggedItem);
  });

  it('handles drop event', () => {
    const dropData: AllocationDragDropEvent = {
      id: 'trash-main',
    };
    const draggedItem = service.peopleDataSet[0];
    const dragData: AllocationDragDropEvent = {
      id: draggedItem.id,
      day: 'tue',
      elemType: 'people',
    };

    const saveEntry = fetchServiceSpy.saveAllocationEntry.and.returnValue(of());
    spyOn(service, 'registerAllocation');

    service.registerDragEvent(dragData);
    service.registerDropEvent(dropData);

    const allocationEntry: AllocationEntry = {
      person: { id: draggedItem.id, value: null },
      day: 'match',
    };

    // TODO review
    // expect(saveEntry).toHaveBeenCalledWith(weekOf, allocationEntry);
  });
});
