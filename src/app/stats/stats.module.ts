import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatsSectionComponent } from './stats-section/stats-section.component';
import { SharedModuleModule } from '../shared-module/shared-module.module';
import { StatsHeaderComponent } from './stats-header/stats-header.component';

@NgModule({
  declarations: [StatsSectionComponent, StatsHeaderComponent],
  imports: [CommonModule, SharedModuleModule],
  exports: [StatsSectionComponent],
})
export class StatsModule {}
