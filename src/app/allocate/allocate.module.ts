import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PeopleListModule } from '../people-list/people-list.module';
import { AllocateSectionComponent } from './allocate-section/allocate-section.component';

@NgModule({
  declarations: [AllocateSectionComponent],
  imports: [CommonModule, PeopleListModule],
  exports: [AllocateSectionComponent],
})
export class AllocateModule {}
