import {
  Config,
  ConfigChange,
  EmailTemplate,
} from 'src/app/shared-module/config.service';

import { Person } from 'src/app/people-list/person';
import {
  Project,
  LeadershipEntry,
} from 'src/app/project-list/project-list/project';
import { StatsEntry } from 'src/app/stats/stats-entry/stats-entry.component';
import { WeeklyData } from 'src/app/shared-module/fetch.service';
import { cleanString, lCaseCompareFn } from 'src/app/utils';
import { AllocationEntry } from '../shared-module/allocate.service';

export type ContactEntry = {
  first: string;
  last: string;
  email: string;
};

export type WeeklyPeopleList = {
  data: Person[];
  updatedAtTs: number;
};

export type WeeklyProjectList = {
  data: Project[];
  updatedAtTs: number;
};

export type ProjectLookupEntry = {
  clients: string[];
  leadership: string[];
};

export interface DataStore {
  master: {
    [key: number]: {
      [pdm: string]: {
        people: Person[];
        isSubmitted: boolean;
      };
    };
    updatedAtTs: number;
  };
  people: {
    [key: number]: Person[];
    updatedAtTs: number;
  };
  projects: {
    [key: number]: Project[];
    updatedAtTs: number;
  };
  lookup: Person[];
  lookupProjects: ProjectLookupEntry;
  config: Config;
  updatedAtTs: number;
  contacts: ContactEntry[];
}

const getDefaultConfig = () => ({
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
});

export const getEmptyStore = (): DataStore => ({
  master: { updatedAtTs: 0 },
  people: {
    updatedAtTs: 0,
  },
  projects: {
    updatedAtTs: 0,
  },
  config: getDefaultConfig(),
  lookup: [],
  lookupProjects: {
    clients: [],
    leadership: [],
  },
  contacts: [],
  updatedAtTs: 0,
});

export interface StoreManager {
  dataStore: DataStore;
  dataStoreError: string | undefined;
  dataStoreFile: File | undefined;
  dataStoreFileUpdateTs: number;

  exportDataStore: () => void;
  getAllocationHistory: (
    from: Date,
    to: Date,
    splitByCST: boolean,
    splitByTags: boolean
  ) => StatsEntry[];
  getConfig: () => Config;
  getContactList: () => ContactEntry[];
  getEmptyStore: () => DataStore;
  getPeopleList: (week: Date) => WeeklyPeopleList;
  getProjectList: (week: Date) => WeeklyProjectList;
  getWeeklyMasterList: (
    week: Date,
    submittedOnly?: boolean,
    customStore?: DataStore
  ) => WeeklyData;
  importDataStore: (s: DataStore) => void;
  saveChangesToConfig: (c: ConfigChange[]) => Config;
  saveChangesToPeopleList: (weekOf: Date, pdm: string, data: Person[]) => void;
  saveChangesToProjectList: (weekOf: Date, data: Project[]) => void;
  saveContactList: (list: ContactEntry[]) => void;
  saveListForLookup: (data: any) => void;
  setDataStore: (s: File | DataStore) => void;
  storeMasterList: (week: Date, data: any) => void;
  submitPeopleList: (weekOf: Date, pdm: string, data: Person[]) => void;
}

export class DataStoreManager implements StoreManager {
  dataStoreFile: File | undefined = undefined;
  dataStore!: DataStore;
  dataStoreError: string | undefined = undefined;
  dataStoreFileUpdateTs: number = 0;

  constructor() {
    this.dataStore = this.getEmptyStore();
  }

  #getDefaultConfig(): Config {
    return getDefaultConfig();
  }

  // **************************
  // IMPORT / EXPORT
  // **************************

  exportDataStore() {
    const a = document.createElement('a');
    a.download = this.dataStoreFile?.name || 'iBeach data.txt';
    const blob = new Blob([JSON.stringify(this.dataStore)], {
      type: 'text/plain',
    });
    a.href = URL.createObjectURL(blob);
    a.click();
    URL.revokeObjectURL(a.href);
    this.dataStoreFileUpdateTs = this.dataStore.updatedAtTs;
  }

  importDataStore(store: DataStore) {
    this.dataStore = store;
    this.storeMasterProjectData(store.projects);
    this.dataStoreFileUpdateTs = store.updatedAtTs;
  }

  // **************************
  // GETTERS
  // **************************

  getAllocationHistory(
    from: Date,
    to: Date,
    splitByCST: boolean = false,
    splitByTags: boolean = false
  ): StatsEntry[] {
    const NAME_BREAK = '[nbr]';
    const fromTS = from.getTime();
    const toTS = to.getTime();
    const { updatedAtTs, ...projectEntries } = this.dataStore.projects;
    const projectMap: {
      [client: string]: {
        got: number;
        asked: number;
      };
    } = Object.entries(projectEntries)
      .filter(([key]) => {
        const int = parseInt(key);

        return int >= fromTS && int <= toTS;
      })
      .flatMap(([key, projectArr]) => projectArr)
      .reduce((acc: any, project) => {
        const { client, week, daysLeft, leadership } = project as Project;

        const daysAllocated = Object.values(week).reduce((acc: number, val) => {
          if (typeof val !== 'boolean') {
            return acc + 1;
          }

          return acc;
        }, 0);

        const clientKey = !splitByCST
          ? client
          : `${client}--${leadership
              .filter((entry) => entry.mainContact)
              .sort((a, b) => {
                const nameA = a.name.toUpperCase();
                const nameB = b.name.toUpperCase();

                if (nameA < nameB) {
                  return -1;
                }
                if (nameA > nameB) {
                  return 1;
                }

                return 0;
              })
              .map((entry) => entry.name.replace('*', ''))
              .join(NAME_BREAK)}`;

        return {
          ...acc,
          [clientKey]: {
            ...(acc[clientKey] || {}),
            asked: (acc[clientKey]?.asked || 0) + daysAllocated + daysLeft,
            got: (acc[clientKey]?.got || 0) + daysAllocated,
          },
        };
      }, {});

    const statsEntryArr: StatsEntry[] = Object.entries(projectMap).map(
      ([client, entry]) => {
        const clientName = !splitByCST ? client : client.split('--')[0];
        const leadership = !splitByCST
          ? []
          : client.split('--')[1].split(NAME_BREAK);

        return {
          client: clientName,
          days: {
            ...entry,
          },
          leadership,
        };
      }
    );

    return statsEntryArr;
  }

  getConfig(): Config {
    return this.dataStore.config || this.#getDefaultConfig();
  }

  getContactList(): ContactEntry[] {
    return this.dataStore.contacts;
  }

  getEmptyStore() {
    return getEmptyStore();
  }

  getPeopleList(week: Date): WeeklyPeopleList {
    const ts = week.getTime();
    const data = this.dataStore.people[ts] || [];
    const { updatedAtTs } = this.dataStore.people;

    return {
      data,
      updatedAtTs,
    };
  }

  getProjectList(week: Date): WeeklyProjectList {
    const ts = week.getTime();
    const data = this.dataStore.projects[ts] || [];
    const { updatedAtTs } = this.dataStore.projects;

    return {
      data,
      updatedAtTs,
    };
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

  async readStoreDataFromFile(file: File): Promise<DataStore> {
    return new Promise<DataStore>((resolve, reject) => {
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
  }

  // **************************
  // SETTERS
  // **************************

  saveChangesToConfig(configChanges: ConfigChange[]) {
    for (let change of configChanges) {
      const { field, value } = change;

      if (field === 'pdms') {
        const pdmArr =
          typeof value === 'string' ? value.split(', ') : (value as string[]);
        this.dataStore.config.pdms = pdmArr;
      }

      if (field === 'email') {
        this.dataStore.config.email.current = value as EmailTemplate;
      }
    }
    this.dataStore.updatedAtTs = Date.now();
    return this.dataStore.config;
  }

  saveChangesToPeopleList(
    weekOf: Date,
    pdm: string,
    data: Person[],
    append: boolean = false
  ) {
    const weekTs = weekOf.getTime();
    const ts = Date.now();

    const pdmEntry = pdm ? pdm : 'unknown';

    // if pdm is allocator, it means the change was done in the "allocate" section
    // i.e. people array in store should be updated; otherwise a names pdm
    // doing changes in master list before submitting
    if (pdmEntry === 'allocator') {
      this.dataStore.people[weekTs] = append
        ? [...(this.dataStore.people[weekTs] || []), ...data]
        : [...data];
      this.dataStore.people.updatedAtTs = ts;
    } else {
      this.dataStore.master[weekTs] = {
        ...this.dataStore.master[weekTs],
        [pdmEntry]: {
          ...this.dataStore.master?.[weekTs]?.[pdmEntry],
          people: data,
        },
      };

      this.dataStore.master.updatedAtTs = ts;
    }
    this.dataStore.updatedAtTs = Date.now();
    this.#syncLocalStorage();
  }

  saveChangesToProjectList(weekOf: Date, data: Project[]) {
    const weekTs = weekOf.getTime();
    const ts = Date.now();
    this.dataStore.projects[weekTs] = data;
    this.dataStore.projects.updatedAtTs = ts;
    this.dataStore.updatedAtTs = Date.now();
    this.dataStore.lookupProjects.clients = [
      ...new Set([
        ...this.dataStore.lookupProjects.clients,
        ...data.map((project) => cleanString(project.client)),
      ]),
    ].sort();
    this.dataStore.lookupProjects.leadership = [
      ...new Set([
        ...this.dataStore.lookupProjects.leadership,
        ...data.flatMap((project) =>
          project.leadership.map(({ name }) => cleanString(name))
        ),
      ]),
    ].sort();
    this.#syncLocalStorage();
  }

  async setDataStore(store: File | DataStore) {
    let storeJSON: DataStore;

    try {
      if (isFile(store)) {
        this.dataStoreFile = store;
        storeJSON = await this.readStoreDataFromFile(store);
        this.dataStoreFileUpdateTs = storeJSON.updatedAtTs;
      } else {
        storeJSON = store;
      }
      this.dataStore = storeJSON;
      this.#syncLocalStorage();
    } catch (e) {
      console.log(e);
      this.dataStoreError = 'Unable to read file. Try again';
    }
  }

  saveContactList(list: ContactEntry[]) {
    this.dataStore.contacts = list;
    this.dataStore.updatedAtTs = Date.now();
    this.#syncLocalStorage();
  }

  saveListForLookup(data: any, listType: 'people' | 'projects' = 'people') {
    if (this.dataStore === undefined) {
      this.dataStore = this.getEmptyStore();
    }
    if (listType === 'people') {
      this.dataStore.lookup = data;
    } else {
      this.dataStore.lookupProjects = data;
    }

    this.dataStore.updatedAtTs = Date.now();
    this.#syncLocalStorage();
  }

  storeMasterList(
    weekOf: Date,
    data: {
      week: Person[];
      full: Person[];
    }
  ) {
    const weekTs = weekOf.getTime();
    const ts = Date.now();
    const { week, full } = data;

    if (!this.dataStore?.master) {
      this.dataStore.master = {
        updatedAtTs: ts,
      };
    }

    // take pdm list from configuration or - if not available - from the uploaded list

    if (!this.dataStore.config.pdms.length) {
      const pdmArr = Array.from(new Set(full.map(({ pdm }) => pdm as string)));
      this.dataStore.config.pdms = pdmArr;
    }

    const weeklyData = week
      .filter(({ pdm }) =>
        this.dataStore.config.pdms
          .map((pdm) => pdm.toLowerCase())
          .includes((pdm as string).toLowerCase())
      )
      .reduce((acc: any, personEntry) => {
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
    this.dataStore.updatedAtTs = ts;

    this.saveListForLookup(full.map((person) => person.name).sort());
  }

  storeMasterProjectData(data: {
    [key: number]: Project[];
    updatedAtTs: number;
  }) {
    const clientSet = new Set<string>();
    const leaderSet = new Set<string>();

    for (let [key, val] of Object.entries(data)) {
      if (key === 'updatedAtTs' || typeof val === 'number') {
        continue;
      }

      for (let project of val) {
        const { client, leadership } = project;

        clientSet.add(cleanString(client));

        for (let { name } of leadership) {
          leaderSet.add(cleanString(name));
        }
      }
    }

    if (!this.dataStore?.lookupProjects) {
      this.dataStore.lookupProjects = {
        clients: [],
        leadership: [],
      };
    }

    const clientArr = [...clientSet].sort(lCaseCompareFn);
    const leaderArr = [...leaderSet].sort(lCaseCompareFn);

    this.saveListForLookup(
      { clients: clientArr, leadership: leaderArr },
      'projects'
    );
  }

  submitPeopleList(weekOf: Date, pdm: string, data: Person[]) {
    const weekTs = weekOf.getTime();
    const ts = Date.now();

    this.dataStore.master[weekTs][pdm] = {
      ...this.dataStore!.master[weekTs][pdm],
      people: data,
      isSubmitted: true,
    };
    this.dataStore.master.updatedAtTs = ts;

    // update people section of the store (pdm param === "allocator" to indicate changes are to be done to allocate, not submit, section)
    this.saveChangesToPeopleList(weekOf, 'allocator', data, true);
  }

  #syncLocalStorage() {
    // window.localStorage.setItem('iBeach', JSON.stringify(this.dataStore));
  }
}

function isFile(param: File | DataStore): param is File {
  return (param as File).size !== undefined;
}
