import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { PeopleListModule } from './people-list/people-list.module';
import { AllocateModule } from './allocate/allocate.module';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    PeopleListModule,
    AllocateModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
