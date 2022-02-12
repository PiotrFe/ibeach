import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FetchService, WeeklyData } from 'src/app/shared-module/fetch.service';
import { dummyWeeklyData } from 'src/app/shared-module/fetch.service.spec';
import { CsvParserService } from 'src/app/shared-module/csv-parser.service';
import { ResizeObserverService } from 'src/app/shared-module/resize-observer.service';
import { of } from 'rxjs';
import { personDataBasic } from 'src/app/utils/dummyData';

import { UploadSectionComponent } from './upload-section.component';

@Component({
  selector: 'modal-window',
  template: '',
})
class ModalStub {}

@Component({
  selector: 'person-entry',
  template: '',
})
class PersonEntryStub {}

@Component({
  selector: 'people-list-header',
  template: '',
})
class HeaderStub {}

const spyParserService = jasmine.createSpyObj('CsvParserService', ['parse']);

const resizeObserverStub = {
  registerElem() {},
  currentWidth$: of('abc', 1000),
  deregisterElem() {},
};

const fetchSpy: jasmine.SpyObj<FetchService> = jasmine.createSpyObj(
  'FetchService',
  {
    fetchWeeklyList: of(),
    saveList: of(),
    submitList: of(),
    storeMasterList: of(),
  }
);

describe('UploadSectionComponent', () => {
  let component: UploadSectionComponent;
  let fixture: ComponentFixture<UploadSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        UploadSectionComponent,
        ModalStub,
        PersonEntryStub,
        HeaderStub,
      ],
      providers: [
        { provide: ResizeObserverService, useValue: resizeObserverStub },
        { provide: FetchService, useValue: fetchSpy },
        { provide: CsvParserService, useValue: spyParserService },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UploadSectionComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('fetches data on date change', () => {
    const newDate = new Date();

    component.previewData = [...personDataBasic];

    spyOn(component, 'fetchData');
    spyOn(component, 'onDateChange');

    component.handleDateChange(newDate);

    expect(component.onDateChange).toHaveBeenCalledWith(newDate);
    expect(component.previewData.length).toBe(0);
    expect(component.fetchData).toHaveBeenCalled();
  });

  it('fetches data from fetch service', () => {
    const weeklyData: WeeklyData = dummyWeeklyData;
    fetchSpy.fetchWeeklyList.and.returnValue(of(weeklyData));

    const refDate = new Date();
    component.referenceDate = refDate;

    component.fetchData();
    expect(fetchSpy.fetchWeeklyList).toHaveBeenCalledWith(refDate, true);
  });

  it('shows submit modal when data submitted', () => {
    component.showUploadModal = false;
    component.onSubmit();
    expect(component.showUploadModal).toBeTrue();
  });

  it('closes modal and uploads data', () => {
    component.showUploadModal = true;
    spyOn(component, 'uploadData');

    component.handleModalClose(true);

    expect(component.showUploadModal).toBeFalse();
    expect(component.uploadData).toHaveBeenCalled();
  });

  it('uploads data', () => {
    fetchSpy.storeMasterList.and.returnValue(of());
    component.uploadData();
    expect(fetchSpy.storeMasterList).toHaveBeenCalled();
  });
});
