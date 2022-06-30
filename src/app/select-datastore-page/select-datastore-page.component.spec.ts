import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectDatastorePageComponent } from './select-datastore-page.component';

describe('SelectDatastorePageComponent', () => {
  let component: SelectDatastorePageComponent;
  let fixture: ComponentFixture<SelectDatastorePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SelectDatastorePageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectDatastorePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
