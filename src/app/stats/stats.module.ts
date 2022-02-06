import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatsSectionComponent } from './stats-section/stats-section.component';
import { SharedModuleModule } from '../shared-module/shared-module.module';
import { StatsHeaderComponent } from './stats-header/stats-header.component';
import { StatsEntryComponent } from './stats-entry/stats-entry.component';
import { ProgressbarModule } from 'ngx-bootstrap/progressbar';

@NgModule({
  declarations: [
    StatsSectionComponent,
    StatsHeaderComponent,
    StatsEntryComponent,
  ],
  imports: [CommonModule, SharedModuleModule, ProgressbarModule.forRoot()],
  exports: [StatsSectionComponent],
})
export class StatsModule {}
