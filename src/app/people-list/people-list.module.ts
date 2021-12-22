import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PeopleListComponent } from './people-list/people-list.component';
import { PersonEntryComponent } from './person-entry/person-entry.component';
import { PersonEntryFormComponent } from './person-entry-form/person-entry-form.component';
import { SharedModuleModule } from '../shared-module/shared-module.module';
import { TypeaheadModule } from 'ngx-bootstrap/typeahead';

@NgModule({
  declarations: [
    PeopleListComponent,
    PersonEntryComponent,
    PersonEntryFormComponent,
  ],
  exports: [PeopleListComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModuleModule,
    TypeaheadModule.forRoot(),
  ],
})
export class PeopleListModule {}
