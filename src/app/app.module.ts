import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AllocateModule } from './allocate/allocate.module';
import { PeopleListModule } from './people-list/people-list.module';
import { ProjectListModule } from './project-list/project-list.module';
import { SharedModuleModule } from './shared-module/shared-module.module';

import { AppComponent } from './app.component';
import { SelectDatastorePageComponent } from './select-datastore-page/select-datastore-page.component';
import { SettingsModule } from './settings/settings.module';
import { StatsModule } from './stats/stats.module';

@NgModule({
  declarations: [AppComponent, SelectDatastorePageComponent],
  imports: [
    AllocateModule,
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    PeopleListModule,
    ProjectListModule,
    SharedModuleModule,
    SettingsModule,
    StatsModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
