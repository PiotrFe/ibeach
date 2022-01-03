import { Component } from '@angular/core';

export const PAGE_SECTIONS = {
  ALLOCATE: 'ALLOCATE',
  SUBMIT: 'SUBMIT',
  UPLOAD: 'UPLOAD',
  ARCHIVE: 'ARCHIVE',
};

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'client-dev-app';
  pageSection = PAGE_SECTIONS.ALLOCATE;
  referenceDate: Date = new Date();

  setPageSection(sectionName: keyof typeof PAGE_SECTIONS): void {
    this.pageSection = sectionName;
  }

  handleDateChange(date: Date) {
    const newDate = date;
    newDate.setHours(0, 0, 0, 0);
    this.referenceDate = newDate;
  }
}
