import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WeekDaysComponent } from './week-days/week-days.component';
import { ModalWindowComponent } from './modal-window/modal-window.component';
import { ModalModule, BsModalRef } from 'ngx-bootstrap/modal';
import { InitialsPipe } from './initials.pipe';

@NgModule({
  declarations: [WeekDaysComponent, ModalWindowComponent, InitialsPipe],
  imports: [CommonModule, ModalModule.forRoot()],
  exports: [WeekDaysComponent, ModalWindowComponent, InitialsPipe],
  providers: [BsModalRef],
})
export class SharedModuleModule {}
