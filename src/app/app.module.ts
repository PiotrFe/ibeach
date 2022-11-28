import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { TooltipModule } from 'ngx-bootstrap/tooltip';

import { AllocateModule } from './allocate/allocate.module';
import { PeopleListModule } from './people-list/people-list.module';
import { ProjectListModule } from './project-list/project-list.module';
import { SharedModuleModule } from './shared-module/shared-module.module';

import { AppComponent } from './app.component';
import { AppEntryComponent } from 'src/app/app-entry.component';
import { SettingsModule } from 'src/app/settings/settings.module';
import { StatsModule } from 'src/app/stats/stats.module';
import { LoginPageComponent } from 'src/app/auth/login-page/login-page.component';

@NgModule({
  declarations: [AppEntryComponent, AppComponent, LoginPageComponent],
  imports: [
    AllocateModule,
    AppRoutingModule,
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    PeopleListModule,
    ProjectListModule,
    ReactiveFormsModule,
    SharedModuleModule,
    SettingsModule,
    StatsModule,
    TooltipModule.forRoot(),
  ],
  providers: [],
  bootstrap: [AppEntryComponent],
})
export class AppModule {}
