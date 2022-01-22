import { ComponentFixture, fakeAsync, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { FetchService } from '../../shared-module/fetch.service';
import { TypeaheadService } from '../../shared-module/typeahead.service';
import { ResizeObserverService } from 'src/app/shared-module/resize-observer.service';
import {
  AllocateService,
  Dataset,
  DeletionEvent,
  SaveEvent,
} from 'src/app/shared-module/allocate.service';
import { Observable, of, Subscription, Subject } from 'rxjs';

import { PeopleListComponent } from './people-list.component';
import { personData } from 'src/app/utils/dummyData';
import { PersonEditable } from '../person';

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

const resizeObserverStub = {
  registerElem() {},
  currentWidth$: of('abc', 1000),
  deregisterElem() {},
};

const typeaheadSpy: jasmine.SpyObj<TypeaheadService> = jasmine.createSpyObj(
  'TypeaheadService',
  ['storeLookupList']
);

const fetchSpy: jasmine.SpyObj<FetchService> = jasmine.createSpyObj(
  'FetchService',
  {
    fetchWeeklyList: of({
      people: [],
      statusSummary: { pending: [], done: [] },
      lookupTable: [],
    }),
    saveList: of(),
    submitList: of(),
  }
);

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

const allocateStub = {
  onDataset: onDataset,
  onDeleteRecord: onDeleteRecord,
  handleDeleteRecord() {},
  registerDataset() {},
  registerSaveEvent() {},
};

describe('PeopleListComponent', () => {
  let component: PeopleListComponent;
  let fixture: ComponentFixture<PeopleListComponent>;
  // let allocateService: jasmine.SpyObj<AllocateService>;
  let allocateService: AllocateService;

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
    component.subscribeToAllocationServices();
    expect(component.allocationDataSubscription).toBeInstanceOf(Subscription);
    expect(component.deleteRecordSubscription).toBeInstanceOf(Subscription);
  });

  it('unsubscribes from services on destroy', () => {
    component.allocationDataSubscription = new Subscription();
    component.deleteRecordSubscription = new Subscription();
    component.resizeSubscription = new Subscription();

    spyOn(component.allocationDataSubscription, 'unsubscribe');
    spyOn(component.deleteRecordSubscription, 'unsubscribe');
    spyOn(component.resizeSubscription, 'unsubscribe');
    spyOn(component.resizeObserverService, 'deregisterElem');

    component.ngOnDestroy();

    expect(component.allocationDataSubscription.unsubscribe).toHaveBeenCalled();
    expect(component.deleteRecordSubscription.unsubscribe).toHaveBeenCalled();
    expect(component.resizeSubscription.unsubscribe).toHaveBeenCalled();
    expect(component.resizeObserverService.deregisterElem).toHaveBeenCalled();
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

  it('updates show avail only filter', () => {
    component.showAvailableOnly = false;
    component.filters = [];

    component.toggleShowAvailableOnly();

    expect(component.showAvailableOnly).toBeTrue();
    expect(component.filters.length).toBe(1);
    expect(component.filters[0].field).toBe('days');
  });
});
