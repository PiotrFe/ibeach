import { Component } from '@angular/core';

export const PAGE_SECTIONS = {
  ALLOCATE: 'ALLOCATE',
  SUBMIT: 'SUBMIT',
  UPLOAD: 'UPLOAD',
  STATS: 'STATS',
};

interface DataStore {
  master: any;
  people: any;
  projects: any;
  config: any;
  lookup: any;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'client-dev-app';

  dataStoreFile: File | undefined = undefined;
  dataStore: DataStore | undefined = undefined;
  dataStoreError: string | undefined = undefined;
  appInOfflineMode: Boolean = true;
  pageSection = PAGE_SECTIONS.ALLOCATE;
  referenceDate: Date = new Date();
  showSettings: boolean = false;

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

  async setDataStore(file: File) {
    this.dataStoreFile = file;

    try {
      const storeDataJSON = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsText(file);

        reader.onload = function () {
          const resultJSON = JSON.parse(reader.result as string);
          resolve(resultJSON);
        };
        reader.onerror = function () {
          console.log(reader.error);
          reject();
        };
      });
      this.dataStore = storeDataJSON as DataStore;
      console.log({
        store: this.dataStore,
      });
    } catch (e) {
      console.log(e);
      this.dataStoreError = 'Unable to read file. Try again';
    }
  }
}
