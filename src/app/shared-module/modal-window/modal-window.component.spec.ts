import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { Subscription, of } from 'rxjs';

import { ModalWindowComponent } from './modal-window.component';

const mockModalService = {
  onHide: of(),
  show() {
    return new BsModalRef();
  },
};

const TITLE = 'modal title';

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

    component.title = TITLE;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit closeEvent on close', () => {
    spyOn(component.closeEvent, 'emit');

    component.close(true);

    expect(component.closeEvent.emit).toHaveBeenCalledWith(true);
  });
});
