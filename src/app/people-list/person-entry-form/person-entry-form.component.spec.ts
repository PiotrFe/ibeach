import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { PersonEntryFormComponent } from './person-entry-form.component';

describe('PersonEntryFormComponent', () => {
  let component: PersonEntryFormComponent;
  let fixture: ComponentFixture<PersonEntryFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PersonEntryFormComponent],
      imports: [BrowserAnimationsModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PersonEntryFormComponent);

    component = fixture.componentInstance;
    component.dispatchToParentAndClose = false;
    component.pdm = '';
    component.getNameTypeAhead = () => {};

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
