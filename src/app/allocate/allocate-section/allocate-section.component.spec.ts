import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllocateSectionComponent } from './allocate-section.component';

describe('AllocateSectionComponent', () => {
  let component: AllocateSectionComponent;
  let fixture: ComponentFixture<AllocateSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AllocateSectionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AllocateSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
