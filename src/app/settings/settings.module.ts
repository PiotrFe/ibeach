import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsComponent } from './settings.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModuleModule } from '../shared-module/shared-module.module';

@NgModule({
  declarations: [SettingsComponent],
  imports: [CommonModule, SharedModuleModule, FormsModule, ReactiveFormsModule],
  exports: [SettingsComponent],
})
export class SettingsModule {}
