import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PeopleListModule } from '../people-list/people-list.module';
import { ProjectListModule } from '../project-list/project-list.module';
import { AllocateSectionComponent } from './allocate-section/allocate-section.component';

@NgModule({
  declarations: [AllocateSectionComponent],
  imports: [CommonModule, PeopleListModule, ProjectListModule],
  exports: [AllocateSectionComponent],
})
export class AllocateModule {}
