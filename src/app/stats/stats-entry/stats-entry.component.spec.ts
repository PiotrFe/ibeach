import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatsEntryComponent } from './stats-entry.component';

xdescribe('StatsEntryComponent', () => {
  let component: StatsEntryComponent;
  let fixture: ComponentFixture<StatsEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StatsEntryComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StatsEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
