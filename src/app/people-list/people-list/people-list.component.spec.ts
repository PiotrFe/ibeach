import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  Component,
  OnInit,
  Input,
  NgZone,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { FetchService } from '../../shared-module/fetch.service';
import { TypeaheadService } from '../../shared-module/typeahead.service';
import { DragAndDropService } from 'src/app/shared-module/drag-and-drop.service';
import { ResizeObserverService } from 'src/app/shared-module/resize-observer.service';
import {
  AllocateService,
  Dataset,
  DeletionEvent,
  SaveEvent,
  isInstanceOfSaveEvent,
} from 'src/app/shared-module/allocate.service';
import { v4 as uuidv4 } from 'uuid';
import { Subscription } from 'rxjs';
import { Person, PersonEditable } from '../person';
import { Tag } from 'src/app/shared-module/entry/entry.component';
import { Week } from 'src/app/shared-module/week-days/week';

import { PeopleListComponent } from './people-list.component';

describe('PeopleListComponent', () => {
  let component: PeopleListComponent;
  let fixture: ComponentFixture<PeopleListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PeopleListComponent],
      providers: [
        { provide: NgZone, useValue: { run() {} } },
        AllocateService,
        FetchService,
        DragAndDropService,
        TypeaheadService,
        ResizeObserverService,
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PeopleListComponent);
    component = fixture.componentInstance;

    component.displayedIn = 'SUBMIT';
    // TODO: change and test later (also in other pages)
    component.fetchData = function () {
      return Promise.resolve();
    };
    component.subscribeToAllocationServices = () => {};
    component.postChanges = () => {};
    component.handleModalClose = async (submit: boolean) => {};
    component.ngOnInit();
    component.ngAfterViewInit();
    fixture.detectChanges();
  });

  // it('should create', () => {
  //   expect(component).toBeTruthy();
  // });
});
