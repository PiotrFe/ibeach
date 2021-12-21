import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PersonEntryFormComponent } from './person-entry-form.component';

describe('PersonEntryFormComponent', () => {
  let component: PersonEntryFormComponent;
  let fixture: ComponentFixture<PersonEntryFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PersonEntryFormComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PersonEntryFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
