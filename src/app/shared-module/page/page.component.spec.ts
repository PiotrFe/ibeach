import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgZone } from '@angular/core';
import { ResizeObserverService } from 'src/app/shared-module/resize-observer.service';
import { TypeaheadService } from '../typeahead.service';
import { of } from 'rxjs';

import { PageComponent } from './page.component';

const mockResizeService = {
  get currentWidth$() {
    return of(['one two three', 123]);
  },
  registerElem() {},
  deregisterElem() {},
};

const mockNgZone = {
  run() {},
};

const mockTypeAhead = {
  getTypeAhead() {},
};

describe('PageComponent', () => {
  let component: PageComponent;
  let fixture: ComponentFixture<PageComponent>;

  // beforeEach(async () => {
  //   await TestBed.configureTestingModule({
  //     declarations: [PageComponent],
  //     providers: [
  //       { provide: NgZone, useValue: mockNgZone },
  //       { provide: ResizeObserverService, useValue: mockResizeService },
  //       { provide: TypeaheadService, useValue: mockTypeAhead },
  //     ],
  //   }).compileComponents();
  // });

  beforeEach(() => {
    // fixture = TestBed.createComponent(PageComponent);

    component = fixture.componentInstance;
    // component.ngAfterViewInit();
    fixture.detectChanges();
  });

  // it('should create', () => {
  //   expect(component).toBeTruthy();
  // });
});
