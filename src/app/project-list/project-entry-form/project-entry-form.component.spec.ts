import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { ProjectEntryFormComponent } from './project-entry-form.component';

describe('ProjectEntryFormComponent', () => {
  let component: ProjectEntryFormComponent;
  let fixture: ComponentFixture<ProjectEntryFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProjectEntryFormComponent],
      imports: [BrowserAnimationsModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectEntryFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
