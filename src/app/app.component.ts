import { Component, OnInit } from '@angular/core';
import { DataStoreService } from 'src/app/shared-module/data-store.service';
import { IsOnlineService } from 'src/app/shared-module/is-online.service';
import { ReferenceDateService } from './shared-module/reference-date.service';
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
  showSettings: boolean = false;

  referenceDate!: Date;
  excludePast!: boolean;

  constructor(
    public dataStoreService: DataStoreService,
    private isOnline: IsOnlineService,
    private referenceDateService: ReferenceDateService
  ) {
    this.isOnline.setIsOnline(false);
    this.referenceDate = this.referenceDateService.referenceDate;
    this.excludePast = this.referenceDateService.excludePast;
  }

  ngOnInit(): void {
    this.referenceDateService.onReferenceDateChange$.subscribe({
      next: ({ referenceDate, excludePast }) => {
        if (referenceDate !== undefined) {
          this.referenceDate = referenceDate;
        }
        if (excludePast !== undefined) {
          this.excludePast = excludePast;
        }
      },
    });

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
    this.referenceDateService.onDateChange(date);
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

  toggleShowPast(e: any) {
    const show = e.target.checked;

    this.referenceDateService.onExcludePastChange(show);
  }
}
