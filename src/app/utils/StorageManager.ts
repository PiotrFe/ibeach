import { Config } from 'src/app/shared-module/config.service';
import { Person } from 'src/app/people-list/person';
import { Project } from 'src/app/project-list/project-list/project';
import { WeeklyData } from 'src/app/shared-module/fetch.service';

export interface DataStore {
  master: {
    [key: number]: {
      [pdm: string]: {
        people: Person[];
        isSubmitted: boolean;
      };
    };
  };
  people: {
    [key: number]: Person[];
  };
  projects: {
    [key: number]: Project[];
  };
  lookup: Person[];
  config: Config;
  updatedAtTs: number;
}

export interface StoreManager {
  dataStore: DataStore;
  dataStoreError: string | undefined;
  dataStoreFile: File | undefined;

  getEmptyStore: () => DataStore;
  getProjectList: (week: Date) => Project[];
  getWeeklyMasterList: (
    week: Date,
    submittedOnly?: boolean,
    customStore?: DataStore
  ) => WeeklyData;
  saveChangesToPeopleList: (weekOf: Date, pdm: string, data: Person[]) => void;
  saveChangesToProjectList: (weekOf: Date, data: Project[]) => void;
  saveListForLookup: (data: any) => void;
  setDataStore: (f: File) => void;
  storeMasterList: (week: Date, data: any) => void;
  submitPeopleList: (weekOf: Date, pdm: string, data: Person[]) => void;
}

export class DataStoreManager implements StoreManager {
  dataStoreFile: File | undefined = undefined;
  dataStore!: DataStore;
  dataStoreError: string | undefined = undefined;

  constructor() {
    this.dataStore = this.getEmptyStore();
  }

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

  #syncLocalStorage() {
    window.localStorage.setItem('iBeach', JSON.stringify(this.dataStore));
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

  getProjectList(week: Date): Project[] {
    const ts = week.getTime();
    return this.dataStore.projects[ts] || [];
  }

  getWeeklyMasterList(
    week: Date,
    submittedOnly?: boolean,
    customStore?: DataStore
  ): WeeklyData {
    const ts = week.getTime();
    const store = customStore || this.dataStore;
    const weekObj = store.master[ts] || {};

    const { pending, submitted, pendingPDMNames, submittedPDMNames } =
      Object.entries(weekObj).reduce(
        (acc: any, [key, val]) => {
          const { people, isSubmitted } = val;

          if (isSubmitted) {
            return {
              ...acc,
              submitted: [...acc.submitted, ...people],
              submittedPDMNames: [...acc.submittedPDMNames, key],
            };
          }
          return {
            ...acc,
            pending: [...acc.pending, ...people],
            pendingPDMNames: [...acc.pendingPDMNames, key],
          };
        },
        {
          pending: [],
          submitted: [],
          pendingPDMNames: [],
          submittedPDMNames: [],
        }
      );

    const lookupTable = this.dataStore.lookup || [];
    const config = this.dataStore.config || this.#getDefaultConfig();

    const statusSummary = {
      pending: pendingPDMNames,
      done: submittedPDMNames,
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

    this.#syncLocalStorage();
  }

  saveChangesToPeopleList(weekOf: Date, pdm: string, data: Person[]) {
    const weekTs = weekOf.getTime();

    this.dataStore.master[weekTs][pdm] = {
      ...this.dataStore!.master[weekTs][pdm],
      people: data,
    };

    this.#syncLocalStorage();
  }

  saveChangesToProjectList(weekOf: Date, data: Project[]) {
    const weekTs = weekOf.getTime();
    this.dataStore.projects[weekTs] = data;
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
      this.#syncLocalStorage();
    } catch (e) {
      console.log(e);
      this.dataStoreError = 'Unable to read file. Try again';
    }
  }

  storeMasterList(
    weekOf: Date,
    data: {
      week: Person[];
      full: Person[];
    }
  ) {
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

    // take pdm list from configuration or - if not available - from the uploaded list
    const pdmArr = this.dataStore.config.pdms.length
      ? this.dataStore.config.pdms
      : Array.from(new Set(full.map(({ pdm }) => pdm)));

    const weeklyData = week.reduce((acc: any, personEntry) => {
      const pdm = personEntry.pdm as string;
      return {
        ...acc,
        [pdm]: {
          ...acc[pdm],
          isSubmitted: false,
          people: [...(acc[pdm]?.people || []), personEntry],
        },
      };
    }, {});

    this.dataStore.master[weekTs] = weeklyData;
    this.dataStore.updatedAtTs = updatedAtTs;

    this.saveListForLookup(full);
  }

  submitPeopleList(weekOf: Date, pdm: string, data: Person[]) {
    const weekTs = weekOf.getTime();

    this.dataStore!.master[weekTs][pdm] = {
      ...this.dataStore!.master[weekTs][pdm],
      people: data,
      isSubmitted: true,
    };

    this.#syncLocalStorage();
  }
}
