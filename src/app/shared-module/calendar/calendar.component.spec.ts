import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BsLocaleService } from 'ngx-bootstrap/datepicker';

import { CalendarComponent } from './calendar.component';

const mockLocaleService = {
  use() {},
};

describe('CalendarComponent', () => {
  let component: CalendarComponent;
  let fixture: ComponentFixture<CalendarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CalendarComponent],
      providers: [{ provide: BsLocaleService, useValue: mockLocaleService }],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CalendarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
