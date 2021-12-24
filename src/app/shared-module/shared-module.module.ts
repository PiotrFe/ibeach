import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WeekDaysComponent } from './week-days/week-days.component';
import { ModalWindowComponent } from './modal-window/modal-window.component';
import { ModalModule, BsModalRef } from 'ngx-bootstrap/modal';

@NgModule({
  declarations: [WeekDaysComponent, ModalWindowComponent],
  imports: [CommonModule, ModalModule.forRoot()],
  exports: [WeekDaysComponent, ModalWindowComponent],
  providers: [BsModalRef],
})
export class SharedModuleModule {}
