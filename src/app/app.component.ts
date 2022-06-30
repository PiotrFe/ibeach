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

class DataStoreManager {
  fileReader!: FileReader;
  dataStoreFile: File | undefined = undefined;
  dataStore: DataStore | undefined = undefined;
  dataStoreError: string | undefined = undefined;

  constructor() {
    this.fileReader = new FileReader();
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
      window.localStorage.setItem('iBeach', JSON.stringify(storeDataJSON));
    } catch (e) {
      console.log(e);
      this.dataStoreError = 'Unable to read file. Try again';
    }
  }

  getEmptyStore() {
    return {
      master: {},
      people: [],
      projects: [],
      config: {},
      lookup: {},
    };
  }

  storeMasterList(weekOf: Date, data: any) {
    const weekTs = weekOf.getTime();

    if (!this.dataStoreFile || this.dataStore === undefined) {
      this.dataStoreError = 'Unable to upload';
      return;
    }

    const { week, full } = data;

    if (!this.dataStore?.master) {
      this.dataStore.master = {};
    }

    this.dataStore.master[weekTs] = week;

    const storeStr = window.localStorage.getItem('iBeach');
    let store = JSON.parse(storeStr as string) as DataStore;

    if (!store) {
      store = this.getEmptyStore();
    }
    store.master[weekTs] = week;
    window.localStorage.setItem('iBeach', JSON.stringify(store));
    this.saveListForLookup(full);
  }

  saveListForLookup(data: any) {
    if (this.dataStore !== undefined) {
      this.dataStore.lookup = data;
    }
    const storeStr = window.localStorage.getItem('iBeach');
    let store = JSON.parse(storeStr as string) as DataStore;
    if (!store) {
      store = this.getEmptyStore();
    }

    store.lookup = data;
    window.localStorage.setItem('iBeach', JSON.stringify(store));
  }
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'client-dev-app';

  appInOfflineMode: Boolean = true;
  dataStoreManager!: any;
  pageSection = PAGE_SECTIONS.ALLOCATE;
  referenceDate: Date = new Date();
  showSettings: boolean = false;

  constructor() {
    this.dataStoreManager = new DataStoreManager();
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
