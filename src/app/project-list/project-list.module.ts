import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModuleModule } from '../shared-module/shared-module.module';
import { ProjectListComponent } from './project-list/project-list.component';
import { TypeaheadModule } from 'ngx-bootstrap/typeahead';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { ProjectListHeaderComponent } from './project-list-header/project-list-header.component';
import { ProjectEntryComponent } from './project-entry/project-entry.component';

@NgModule({
  declarations: [ProjectListComponent, ProjectListHeaderComponent, ProjectEntryComponent],
  imports: [
    CommonModule,
    SharedModuleModule,
    FormsModule,
    ReactiveFormsModule,
    TypeaheadModule.forRoot(),
    TooltipModule.forRoot(),
    CollapseModule.forRoot(),
  ],
  exports: [ProjectListComponent],
})
export class ProjectListModule {}
