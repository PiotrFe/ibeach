import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WeekDaysComponent } from './week-days/week-days.component';

@NgModule({
  declarations: [WeekDaysComponent],
  imports: [CommonModule],
  exports: [WeekDaysComponent],
})
export class SharedModuleModule {}
