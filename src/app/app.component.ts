import { Component, OnInit } from '@angular/core';
import { DataStoreService } from 'src/app/shared-module/data-store.service';
import { IsOnlineService } from 'src/app/shared-module/is-online.service';
import { DataStore } from 'src/app/utils/StorageManager';

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
export class AppComponent implements OnInit {
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

  ngOnInit(): void {
    const storeStr = window.localStorage.getItem('iBeach');

    if (!storeStr) {
      return;
    }

    try {
      const storeJSON = JSON.parse(storeStr);
      this.dataStoreService.setDataStore(storeJSON as DataStore);
    } catch (e) {
      console.log(e);
    }
  }

  closeSettings() {
    this.showSettings = false;
  }

  handleDateChange(date: Date) {
    const newDate = date;
    newDate.setHours(0, 0, 0, 0);
    this.referenceDate = newDate;
  }

  saveChanges() {
    this.dataStoreService.exportDataStore();
  }

  setPageSection(sectionName: keyof typeof PAGE_SECTIONS): void {
    this.pageSection = sectionName;
  }

  toggleShowSettings() {
    this.showSettings = !this.showSettings;
  }
}
