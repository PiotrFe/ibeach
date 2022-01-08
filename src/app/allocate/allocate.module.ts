import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PeopleListModule } from '../people-list/people-list.module';
import { ProjectListModule } from '../project-list/project-list.module';
import { SharedModuleModule } from '../shared-module/shared-module.module';
import { AllocateSectionComponent } from './allocate-section/allocate-section.component';

@NgModule({
  declarations: [AllocateSectionComponent],
  imports: [
    CommonModule,
    PeopleListModule,
    ProjectListModule,
    SharedModuleModule,
  ],
  exports: [AllocateSectionComponent],
})
export class AllocateModule {}
