import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PeopleListHeaderComponent } from './people-list-header.component';

describe('PeopleListHeaderComponent', () => {
  let component: PeopleListHeaderComponent;
  let fixture: ComponentFixture<PeopleListHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PeopleListHeaderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PeopleListHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
