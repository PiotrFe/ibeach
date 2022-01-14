import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { WeekDaysComponent } from './week-days/week-days.component';
import { ModalWindowComponent } from './modal-window/modal-window.component';
import { ModalModule, BsModalRef } from 'ngx-bootstrap/modal';
import { InitialsPipe } from './initials.pipe';
import { CalendarComponent } from './calendar/calendar.component';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { PageComponent } from './page/page.component';
import { LoadingOverlayComponent } from './loading-overlay/loading-overlay.component';
import { HeaderComponent } from './header/header.component';
import { EntryComponent } from './entry/entry.component';
import { TypeaheadModule } from 'ngx-bootstrap/typeahead';
import { FirstInitialPipe } from './first-initial.pipe';
import { ProjectNamePipe } from './project-name.pipe';
import { EmailPreviewComponent } from './email-preview/email-preview.component';

@NgModule({
  declarations: [
    WeekDaysComponent,
    ModalWindowComponent,
    InitialsPipe,
    CalendarComponent,
    PageComponent,
    LoadingOverlayComponent,
    HeaderComponent,
    EntryComponent,
    FirstInitialPipe,
    ProjectNamePipe,
    EmailPreviewComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ModalModule.forRoot(),
    BsDatepickerModule.forRoot(),
    TypeaheadModule.forRoot(),
  ],
  exports: [
    WeekDaysComponent,
    ModalWindowComponent,
    InitialsPipe,
    FirstInitialPipe,
    ProjectNamePipe,
    CalendarComponent,
    PageComponent,
    LoadingOverlayComponent,
    HeaderComponent,
    EntryComponent,
  ],
  providers: [BsModalRef],
})
export class SharedModuleModule {}
