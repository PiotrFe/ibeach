import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { PeopleListModule } from './people-list/people-list.module';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, FormsModule, PeopleListModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
