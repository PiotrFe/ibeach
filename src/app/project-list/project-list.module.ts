import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModuleModule } from '../shared-module/shared-module.module';
import { ProjectListComponent } from './project-list/project-list.component';
import { TypeaheadModule } from 'ngx-bootstrap/typeahead';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { CollapseModule } from 'ngx-bootstrap/collapse';

@NgModule({
  declarations: [ProjectListComponent],
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
