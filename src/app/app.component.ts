import { Component } from '@angular/core';
import { DataStoreService } from 'src/app/shared-module/data-store.service';
import { IsOnlineService } from 'src/app/shared-module/is-online.service';

export const PAGE_SECTIONS = {
  ALLOCATE: 'ALLOCATE',
  SUBMIT: 'SUBMIT',
  UPLOAD: 'UPLOAD',
  STATS: 'STATS',
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
  showSettings: boolean = false;

  constructor(
    public dataStoreService: DataStoreService,
    private isOnline: IsOnlineService
  ) {
    this.isOnline.setIsOnline(false);
  }

  setPageSection(sectionName: keyof typeof PAGE_SECTIONS): void {
    this.pageSection = sectionName;
  }

  handleDateChange(date: Date) {
    const newDate = date;
    newDate.setHours(0, 0, 0, 0);
    this.referenceDate = newDate;
  }

  toggleShowSettings() {
    this.showSettings = !this.showSettings;
  }

  closeSettings() {
    this.showSettings = false;
  }
}
