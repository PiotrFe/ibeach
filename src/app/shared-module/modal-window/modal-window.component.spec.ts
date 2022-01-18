import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { Subscription } from 'rxjs';

import { ModalWindowComponent } from './modal-window.component';

const mockModalService = {
  onHide: {
    subscribe() {},
  },
  show() {},
};

describe('ModalWindowComponent', () => {
  let component: ModalWindowComponent;
  let fixture: ComponentFixture<ModalWindowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ModalWindowComponent],
      providers: [{ provide: BsModalService, useValue: mockModalService }],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModalWindowComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
    component.subscriptions = [];
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
