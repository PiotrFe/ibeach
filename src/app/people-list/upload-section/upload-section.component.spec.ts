import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FetchService } from '../../shared-module/fetch.service';
import { CsvParserService } from '../../shared-module/csv-parser.service';
import { ResizeObserverService } from 'src/app/shared-module/resize-observer.service';
import { NgZone } from '@angular/core';
import { of } from 'rxjs';

import { UploadSectionComponent } from './upload-section.component';

const spyParserService = jasmine.createSpyObj('CsvParserService', ['parse']);
const mockFetch = {
  fetchWeeklyList() {
    return of({
      people: [],
      statusSummary: { pending: [], done: [] },
      lookupTable: [],
    });
  },
};
const mockResize = {
  get currentWidth$() {
    return of(['123', 123]);
  },
};

describe('UploadSectionComponent', () => {
  let component: UploadSectionComponent;
  let fixture: ComponentFixture<UploadSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UploadSectionComponent],
      providers: [
        { provide: NgZone, useValue: { run() {} } },
        { provide: ResizeObserverService, useValue: mockResize },
        { provide: FetchService, useValue: mockFetch },
        { provide: CsvParserService, useValue: spyParserService },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UploadSectionComponent);
    component = fixture.componentInstance;
    component.fetchData = function () {
      return Promise.resolve();
    };
    component.uploadData = function () {
      return Promise.resolve();
    };
    component.ngAfterViewInit();

    fixture.detectChanges();
  });

  // it('should create', () => {
  //   expect(component).toBeTruthy();
  // });
});
