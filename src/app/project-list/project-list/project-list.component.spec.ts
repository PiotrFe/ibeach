import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgZone } from '@angular/core';

import { ProjectListComponent } from './project-list.component';
import { FetchService } from 'src/app/shared-module/fetch.service';
import {
  AllocateService,
  Dataset,
  SaveEvent,
} from 'src/app/shared-module/allocate.service';
import { TypeaheadService } from 'src/app/shared-module/typeahead.service';
import { ResizeObserverService } from 'src/app/shared-module/resize-observer.service';

import { of } from 'rxjs';

const mockAllocateService = {
  get onDataSet() {
    const dataSet: Dataset = {
      dataType: 'people',
      data: [],
      weekOf: new Date(),
    };

    return of(dataSet);
  },

  get onDeleteRecord() {
    const saveEvent: SaveEvent = {
      save: false,
      issuedBy: 'people',
    };

    return of(saveEvent);
  },
};

const mockFetchService = {
  fetchProjectList() {
    return of([]);
  },
  saveProjectList() {
    return of([]);
  },
};

describe('ProjectListComponent', () => {
  let component: ProjectListComponent;
  let fixture: ComponentFixture<ProjectListComponent>;

  beforeEach(async () => {
    const typeaheadService = jasmine.createSpyObj('TypeaheadService', [
      'storeLookupList',
    ]);
    const resizeObserverService = jasmine.createSpyObj(
      'ResizeObserverService',
      ['registerElem']
    );
    const ngZone = jasmine.createSpyObj('NgZone', ['run']);

    await TestBed.configureTestingModule({
      declarations: [ProjectListComponent],
      providers: [
        { provide: FetchService, useValue: mockFetchService },
        { provide: AllocateService, useValue: mockAllocateService },
        { provide: TypeaheadService, useValue: typeaheadService },
        { provide: ResizeObserverService, useValue: resizeObserverService },
        { provide: NgZone, useValue: ngZone },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectListComponent);
    component = fixture.componentInstance;
    component.fetchData = function () {
      return Promise.resolve();
    };
    fixture.detectChanges();
  });

  // it('should create', () => {
  //   expect(component).toBeTruthy();
  // });
});
