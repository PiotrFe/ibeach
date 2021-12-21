import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PeopleListComponent } from './people-list/people-list.component';
import { PersonEntryComponent } from './person-entry/person-entry.component';

@NgModule({
  declarations: [PeopleListComponent, PersonEntryComponent],
  exports: [PeopleListComponent],
  imports: [CommonModule, FormsModule],
})
export class PeopleListModule {}
