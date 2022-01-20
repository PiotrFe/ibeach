import { ComponentFixture, TestBed } from '@angular/core/testing';
import { itLocale } from 'ngx-bootstrap/chronos';

import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HeaderComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit sort event if sortable', () => {
    const CLICK_VAL = 'click_val';
    component.sortable = true;
    spyOn(component.newSortEvent, 'emit');

    component.handleClick(CLICK_VAL);

    expect(component.newSortEvent.emit).toHaveBeenCalledWith(CLICK_VAL);
  });

  it('should return current sort', () => {
    const CURRENT_SORT = {
      field: 'name',
      order: 1,
    };
    component.sortable = true;
    component.currentSort = CURRENT_SORT;

    expect(component.getSort('name', 1)).toBeTrue();
    expect(component.getSort('name', -1)).toBeFalse();
  });

  it('should return false on getSort if not sortable', () => {
    component.sortable = false;

    expect(component.getSort('name', 1)).toBeFalse();
  });
});
