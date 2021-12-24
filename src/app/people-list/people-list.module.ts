import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PeopleListComponent } from './people-list/people-list.component';
import { PersonEntryComponent } from './person-entry/person-entry.component';
import { PersonEntryFormComponent } from './person-entry-form/person-entry-form.component';
import { SharedModuleModule } from '../shared-module/shared-module.module';
import { TypeaheadModule } from 'ngx-bootstrap/typeahead';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { UploadSectionComponent } from './upload-section/upload-section.component';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { PeopleListHeaderComponent } from './people-list-header/people-list-header.component';

@NgModule({
  declarations: [
    PeopleListComponent,
    PersonEntryComponent,
    PersonEntryFormComponent,
    UploadSectionComponent,
    PeopleListHeaderComponent,
  ],
  exports: [PeopleListComponent, UploadSectionComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModuleModule,
    TypeaheadModule.forRoot(),
    TooltipModule.forRoot(),
    BsDatepickerModule.forRoot(),
  ],
})
export class PeopleListModule {}
