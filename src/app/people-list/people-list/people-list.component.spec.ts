import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import { Component } from '@angular/core';
import { FetchService, WeeklyData } from '../../shared-module/fetch.service';
import { TypeaheadService } from '../../shared-module/typeahead.service';
import { ResizeObserverService } from 'src/app/shared-module/resize-observer.service';
import {
  AllocateService,
  Dataset,
  DeletionEvent,
  SaveEvent,
} from 'src/app/shared-module/allocate.service';
import { ConfigService } from 'src/app/shared-module/config.service';
import { Observable, of, Subscription, Subject } from 'rxjs';

import { PeopleListComponent } from './people-list.component';
import { personData, personDataBasic } from 'src/app/utils/dummyData';
import { Person, PersonEditable } from '../person';
import {
  Filter,
  SubmissionStatus,
} from 'src/app/shared-module/page/page.component';
import {
  dummyWeeklyData,
  dummyConfig,
} from 'src/app/shared-module/fetch.service.spec';

@Component({
  selector: 'person-entry',
  template: '',
})
class PersonEntryStub {}

@Component({
  selector: 'person-entry-form',
  template: '',
})
class PersonEntryFormStub {}

@Component({
  selector: 'modal-window',
  template: '',
})
class ModalStub {}

@Component({
  selector: 'loading-overlay',
  template: '',
})
class LoadingOverlayStub {}

@Component({
  selector: 'people-list-header',
  template: '',
})
class HeaderStub {}

const resizeObserverSpy: jasmine.SpyObj<ResizeObserverService> =
  jasmine.createSpyObj('ResizeObserverService', {
    registerElem: null,
    currentWidth$: of(),
  });

let resizeObserverStub: any;

let typeaheadSpy: jasmine.SpyObj<TypeaheadService>;
let fetchSpy: jasmine.SpyObj<FetchService>;

const fakeDataSet = {
  dataType: 'people',
  data: [],
  weekOf: new Date(),
};

const fakeDelEvent = {
  deletedID: 'abc',
  deletedRecordType: 'people',
  affectedSubIDs: [],
};

const allocateSpyObj: jasmine.SpyObj<AllocateService> = jasmine.createSpyObj(
  'AllocateService',
  {
    onDataset: of(),
    onDeleteRecord: new Observable<DeletionEvent | SaveEvent>(),
    handleDeleteRecord: undefined,
    registerDataset: undefined,
    registerSaveEvent: undefined,
  }
);

const datasetSubject: Subject<Dataset> = new Subject<Dataset>();
const deleteRecordSubject: Subject<DeletionEvent | SaveEvent> = new Subject<
  DeletionEvent | SaveEvent
>();

const onDataset = datasetSubject.asObservable();
const onDeleteRecord = deleteRecordSubject.asObservable();

let allocateStub: any;

describe('PeopleListComponent', () => {
  let component: PeopleListComponent;
  let fixture: ComponentFixture<PeopleListComponent>;
  let allocateService: AllocateService;

  resizeObserverStub = {
    registerElem() {},
    currentWidth$: of('abc', 1000),
    deregisterElem() {},
  };

  typeaheadSpy = jasmine.createSpyObj('TypeaheadService', ['storeLookupList']);

  fetchSpy = jasmine.createSpyObj('FetchService', {
    fetchWeeklyList: of({
      people: [],
      statusSummary: { pending: [], done: [] },
      lookupTable: [],
    }),
    saveList: of(),
    submitList: of(),
  });

  const configStub = {
    setConfig() {},
    updateConfig() {},
    onConfig: of(dummyConfig),
  };

  allocateStub = {
    onDataset: onDataset,
    onDeleteRecord: onDeleteRecord,
    handleDeleteRecord() {},
    registerDataset() {},
    registerSaveEvent() {},
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        PeopleListComponent,
        PersonEntryStub,
        PersonEntryFormStub,
        ModalStub,
        LoadingOverlayStub,
        HeaderStub,
      ],
      providers: [
        { provide: AllocateService, useValue: allocateStub },
        { provide: FetchService, useValue: fetchSpy },
        { provide: TypeaheadService, useValue: typeaheadSpy },
        { provide: ResizeObserverService, useValue: resizeObserverStub },
        {
          provide: ConfigService,
          useValue: configStub,
        },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PeopleListComponent);
    component = fixture.componentInstance;
    component.displayedIn = 'SUBMIT';

    allocateService = TestBed.inject(AllocateService);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('subscribes to allocation services', () => {
    spyOn(allocateService.onDataset, 'subscribe');
    spyOn(allocateService.onDeleteRecord, 'subscribe');
    spyOn(component.subscription, 'add');

    component.subscribeToAllocationServices();
    expect(component.subscription.add).toHaveBeenCalledTimes(2);
    expect(allocateService.onDataset.subscribe).toHaveBeenCalled();
    expect(allocateService.onDeleteRecord.subscribe).toHaveBeenCalled();
  });

  it('unsubscribes from services on destroy', () => {
    spyOn(component.subscription, 'unsubscribe');
    component.ngOnDestroy();
    expect(component.subscription.unsubscribe).toHaveBeenCalled();
  });

  it('posts changes on save event', () => {
    const e: SaveEvent = {
      save: true,
      issuedBy: 'projects',
    };
    component.modifiedEntries = personData;

    spyOn(component, 'postChanges');

    component._handleSaveOrDelete(e);
    expect(component.postChanges).toHaveBeenCalled();
  });

  it('modifies view and does not post if not ready to save', () => {
    const e: SaveEvent = {
      save: false,
      issuedBy: 'projects',
    };

    const modifiedElem = {
      ...personData[0],
      skill: 'associate',
    };

    component.dataSet = personData;
    component.modifiedEntries = [modifiedElem];

    spyOn(component, 'postChanges');
    spyOn(component, 'updateFilteredView');

    component._handleSaveOrDelete(e);

    expect((component.dataSet as PersonEditable[])[0].skill).toBe('associate');
    expect(component.postChanges).not.toHaveBeenCalled();
    expect(component.updateFilteredView).toHaveBeenCalled();
  });

  it("clears peoples' calendars if a project entry has been deleted", () => {
    const PID = 'projectID';

    const ppl = JSON.parse(JSON.stringify(personData));

    const e: DeletionEvent = {
      deletedID: PID,
      deletedRecordType: 'projects',
      affectedSubIDs: [ppl[0].id, ppl[1].id],
    };

    component.dataSet = ppl;
    component.dataSet[0].week.mon = {
      id: PID,
      text: 'project name',
    };
    component.dataSet[1].week.fri = {
      id: PID,
      text: 'project name',
    };

    spyOn(component, 'updateFilteredView');
    spyOn(component, '_handleDelete').and.callThrough();

    component._handleSaveOrDelete(e);

    expect(component._handleDelete).toHaveBeenCalledWith(e);
    expect(component.modifiedEntries.length).toBe(2);
    expect(component.dataSet[0].week.mon).toBeTrue();
    expect(component.dataSet[1].week.fri).toBeTrue();
    expect(component.updateFilteredView).toHaveBeenCalled();
  });

  it('updates PDM filter', () => {
    const pdmName = 'John Smith';
    const e = {
      target: {
        value: pdmName,
      },
    };

    spyOn(component, 'clearEditModeOptions');
    spyOn(component, 'updateStatusLabel');
    spyOn(component, 'updateFilter');
    spyOn(component, 'updateFilteredView');

    component.updatePDMFilter(e);

    expect(component.clearEditModeOptions).toHaveBeenCalled();
    expect(component.updateStatusLabel).toHaveBeenCalled();
    expect(component.updateFilter).toHaveBeenCalledWith('pdm', pdmName);
    expect(component.updateFilteredView).toHaveBeenCalled();

    component.filters = [{ field: 'pdm', value: 'Joe Doe' }];
    e.target.value = 'All';
    component.updatePDMFilter(e);

    expect(component.filters.length).toBe(0);
  });

  it('updates skill filter', () => {
    const e = {
      target: {
        value: 'EM',
      },
    };

    spyOn(component, 'updateFilter');

    component.updateSkillFilter(e);

    expect(component.updateFilter).toHaveBeenCalledWith(
      'skill',
      e.target.value
    );
  });

  it('clears skill filter', () => {
    const e = {
      target: {
        value: 'All',
      },
    };

    component.filters = [
      {
        field: 'skill',
        value: 'EM',
      },
    ];

    spyOn(component, 'updateFilter');

    component.updateSkillFilter(e);

    expect(component.filters.length).toBe(0);
    expect(component.updateFilter).not.toHaveBeenCalled();
  });

  it('updates show avail only filter', () => {
    component.showAvailableOnly = false;
    component.filters = [];

    component.toggleShowAvailableOnly();

    expect(component.showAvailableOnly).toBeTrue();
    expect(component.filters.length).toBe(1);
    expect(component.filters[0].field).toBe('days');
  });

  it('clears all filters', () => {
    component.filters = [
      {
        field: 'skill',
        value: 'EM',
      },
    ];

    component.showAvailableOnly = true;

    spyOn(component, 'clearEditModeOptions');
    component.clearFilters();

    expect(component.filters.length).toBe(0);
    expect(component.clearEditModeOptions).toHaveBeenCalled;
    expect(component.pdmFilter.value).toBe('All');
  });

  it('clears edit mode options', () => {
    component.statusLabel = 'pending';
    component.inEditMode = true;
    component.newRows = [personData[0]];

    component.clearEditModeOptions();

    expect(component.statusLabel).toBe('');
    expect(component.inEditMode).toBe(false);
    expect(component.newRows.length).toBe(0);
  });

  it('updates submit status label', () => {
    const submissionStatus: SubmissionStatus = {
      done: ['Amy Wine'],
      pending: ['Mark Bowers'],
    };
    component.status = submissionStatus;
    component.pdmFilter.setValue('All');

    component.updateStatusLabel();
    expect(component.statusLabel).toBe('');

    component.pdmFilter.setValue('Amy Wine');
    component.updateStatusLabel();
    expect(component.statusLabel).toBe('done');

    component.pdmFilter.setValue('Mark Bowers');
    component.updateStatusLabel();
    expect(component.statusLabel).toBe('pending');
  });

  it('adds new empty row', () => {
    component.addNewRow();

    expect(component.newRows.length).toBe(1);
    expect(component.newRows[0]).toBeTruthy();
    expect(component.newRows[0].id).toBeTruthy();
  });

  it('removes an existing row', () => {
    const idToDelete = personData[0].id;
    component.dataSet = [...personData];

    spyOn(allocateStub, 'handleDeleteRecord');

    component.removeExistingRow(idToDelete);

    expect(component.dataSet.length).toBe(2);
    expect(allocateStub.handleDeleteRecord).toHaveBeenCalled();
  });

  it("updates a person's details", () => {
    component.dataSet = [...personData];

    const updatedEntry: PersonEditable = {
      ...personData[0],
      skill: 'director',
    };

    component.updatePersonDetails(updatedEntry);

    expect((component.dataSet as PersonEditable[])[0].skill).toBe('director');
  });

  it('adds a new person', () => {
    const newEntry = personData[2];

    component.dataSet = [personData[0], personData[1]];
    component.newRows = [newEntry];

    spyOn(component.sortService, 'clearSort');

    component.addPerson(newEntry);

    expect(component.sortService.clearSort).toHaveBeenCalled();
    expect(component.dataSet.length).toBe(3);
    expect(component.newRows.length).toBe(0);
    expect(component.dataSet[0].id).toBe(newEntry.id);
  });

  it('fetches weekly data', () => {
    const data: WeeklyData = dummyWeeklyData;

    fetchSpy.fetchWeeklyList.and.returnValue(of(data));

    spyOn(component, '_onWeeklyData');

    const refDate = new Date();
    component.displayedIn = 'ALLOCATE';
    component.referenceDate = refDate;

    component.fetchData();

    expect(fetchSpy.fetchWeeklyList).toHaveBeenCalledWith(
      component.referenceDate,
      true,
      false
    );
    expect(component._onWeeklyData).toHaveBeenCalledOnceWith(data);
  });

  it('processes weekly data', () => {
    const peopleList: Person[] = [...personDataBasic];

    const data: WeeklyData = dummyWeeklyData;

    spyOn(component, 'updateStatusLabel');

    component._onWeeklyData(data);

    expect(component.dataSet.length).toBe(3);
    expect(component.dataSet[0].inEditMode).toBe(false);
    expect(component.dataSet[0].id).toBe('c');
    expect(component.updateStatusLabel).toHaveBeenCalled();
  });

  it('posts changes', () => {
    fetchSpy.saveList.and.returnValue(of());

    component.displayedIn = 'ALLOCATE';

    spyOn(component, 'fetchData');

    component.postChanges();

    expect(component.fetching).toBeTrue();
    expect(fetchSpy.saveList).toHaveBeenCalled();
  });

  it('handles modal close', () => {
    component.showSubmitModal = true;
    component.handleModalClose(true);

    expect(component.showSubmitModal).toBe(false);
    expect(fetchSpy.submitList).toHaveBeenCalled();
  });

  it('handles date change', () => {
    const date = new Date();

    spyOn(component, 'onDateChange');
    spyOn(component, 'fetchData');

    component.handleDateChange(date);

    expect(component.onDateChange).toHaveBeenCalledWith(date);
    expect(component.fetchData).toHaveBeenCalled();
  });

  it('cancels changes and fetches data', () => {
    spyOn(allocateStub, 'registerSaveEvent');
    spyOn(component, 'onCancelChanges');
    spyOn(component, 'fetchData');

    component.cancelChanges();

    expect(allocateStub.registerSaveEvent).toHaveBeenCalled();
    expect(component.onCancelChanges).toHaveBeenCalled();
    expect(component.fetchData).toHaveBeenCalled();
  });

  it('saves changes', fakeAsync(() => {
    spyOn(allocateStub, 'registerSaveEvent');
    spyOn(component, 'postChanges');

    component.saveChanges();
    tick();
    expect(allocateStub.registerSaveEvent).toHaveBeenCalled();
    expect(component.postChanges).toHaveBeenCalled();
  }));
});
