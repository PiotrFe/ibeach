import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { PeopleListModule } from './people-list/people-list.module';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, FormsModule, PeopleListModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
