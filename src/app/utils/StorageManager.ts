import { Config } from 'src/app/shared-module/config.service';
import { Person } from 'src/app/people-list/person';
import { WeeklyData } from 'src/app/shared-module/fetch.service';

export interface DataStore {
  master: {
    [key: number]: {
      pending: Person[];
      submitted: Person[];
    };
  };
  people: Person[];
  projects: any;
  lookup: Person[];
  config: Config;
  updatedAtTs: number;
}

export interface StoreManager {
  dataStore: DataStore | undefined;
  dataStoreError: string | undefined;
  dataStoreFile: File | undefined;
  getEmptyStore: () => DataStore;
  getWeeklyMasterList: (week: Date, submittedOnly?: boolean) => WeeklyData;
  saveListForLookup: (data: any) => void;
  setDataStore: (f: File) => void;
  storeMasterList: (week: Date, data: any) => void;
}

export class DataStoreManager implements StoreManager {
  dataStoreFile: File | undefined = undefined;
  dataStore: DataStore | undefined = undefined;
  dataStoreError: string | undefined = undefined;

  constructor() {}

  #getDefaultConfig(): Config {
    return {
      pdms: [],
      email: {
        current: {
          subject: '',
          content: '',
          contentNoAllocation: '',
        },
        default: {
          subject: '',
          content: '',
          contentNoAllocation: '',
        },
      },
    };
  }

  getEmptyStore() {
    return {
      master: {},
      people: [],
      projects: [],
      config: this.#getDefaultConfig(),
      lookup: [],
      updatedAtTs: Date.now(),
    };
  }

  getWeeklyMasterList(week: Date, submittedOnly?: boolean): WeeklyData {
    const ts = week.getTime();
    const { pending = [], submitted = [] } = this.dataStore?.master[ts] || {};
    const lookupTable = this.dataStore?.lookup || [];
    const config = this.dataStore?.config || this.#getDefaultConfig();
    const pendingPDMArr: string[] = !this.dataStore
      ? []
      : Array.from(new Set(pending.map(({ pdm }) => pdm as string)));
    const submittedPDMArr: string[] = !this.dataStore
      ? []
      : Array.from(new Set(submitted.map(({ pdm }) => pdm as string)));

    const statusSummary = {
      pending: pendingPDMArr,
      done: submittedPDMArr,
    };

    return {
      people: submittedOnly ? submitted : [...pending, ...submitted],
      statusSummary,
      lookupTable,
      config,
    };
  }

  saveListForLookup(data: any) {
    const updateTs = Date.now();
    if (this.dataStore === undefined) {
      this.dataStore = this.getEmptyStore();
    }
    this.dataStore.lookup = data;
    this.dataStore.updatedAtTs = updateTs;

    const storeStr = window.localStorage.getItem('iBeach');
    let store = JSON.parse(storeStr as string) as DataStore;

    store.lookup = data;
    store.updatedAtTs = updateTs;
    window.localStorage.setItem('iBeach', JSON.stringify(store));
  }

  async setDataStore(file: File) {
    this.dataStoreFile = file;

    try {
      const storeDataJSON = await new Promise<DataStore>((resolve, reject) => {
        const fileReader = new FileReader();
        fileReader.readAsText(file);

        fileReader.onload = function () {
          const resultJSON = JSON.parse(fileReader.result as string);
          resolve(resultJSON as DataStore);
        };
        fileReader.onerror = function () {
          console.log(fileReader.error);
          reject();
        };
      });
      this.dataStore = storeDataJSON;
      window.localStorage.setItem('iBeach', JSON.stringify(storeDataJSON));
    } catch (e) {
      console.log(e);
      this.dataStoreError = 'Unable to read file. Try again';
    }
  }

  storeMasterList(weekOf: Date, data: any) {
    const weekTs = weekOf.getTime();

    if (!this.dataStoreFile || this.dataStore === undefined) {
      this.dataStoreError = 'Unable to upload';
      return;
    }

    const { week, full } = data;
    const updatedAtTs = Date.now();

    if (!this.dataStore?.master) {
      this.dataStore.master = {};
    }

    const weeklyData = {
      pending: week,
      submitted: [],
    };

    this.dataStore.master[weekTs] = weeklyData;
    this.dataStore.updatedAtTs = updatedAtTs;

    const storeStr = window.localStorage.getItem('iBeach');
    let store = JSON.parse(storeStr as string) as DataStore;

    if (!store) {
      store = this.getEmptyStore();
    }
    store.master[weekTs] = weeklyData;
    store.updatedAtTs = Date.now();
    window.localStorage.setItem('iBeach', JSON.stringify(store));
    this.saveListForLookup(full);
  }
}
