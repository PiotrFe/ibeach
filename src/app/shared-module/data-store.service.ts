import { Subject } from 'rxjs';
import { Injectable } from '@angular/core';
import { Config, ConfigChange } from 'src/app/shared-module/config.service';
import {
  ContactEntry,
  DataStore,
  DataStoreManager,
  StoreManager,
  WeeklyPeopleList,
  WeeklyProjectList,
} from 'src/app/utils/StorageManager';

import { Person } from 'src/app/people-list/person';
import { Project } from 'src/app/project-list/project-list/project';
import { WeeklyData } from 'src/app/shared-module/fetch.service';

@Injectable({
  providedIn: 'root',
})
export class DataStoreService {
  dataStoreManager!: StoreManager;
  #dataStoreSubject: Subject<DataStore> = new Subject<DataStore>();
  storeData$ = this.#dataStoreSubject.asObservable();

  constructor() {
    this.dataStoreManager = new DataStoreManager();
    this.init();
  }

  init() {
    window.addEventListener('beforeunload', (e) => {
      e.preventDefault();
      console.log(this.areChangesPending);
      if (this.areChangesPending) {
        return (e.returnValue = 'Are you sure you want to exit?');
      }

      return null;
    });
  }

  get hasActiveDataStore(): boolean {
    return Boolean(this.dataStoreManager.dataStoreFile);
  }

  get areChangesPending(): boolean {
    return (
      this.dataStoreManager.dataStore.updatedAtTs >
      this.dataStoreManager.dataStoreFileUpdateTs
    );
  }

  exportDataStore() {
    this.dataStoreManager.exportDataStore();
  }

  getConfig(): Config {
    return this.dataStoreManager.getConfig();
  }

  getContactList(): ContactEntry[] {
    return this.dataStoreManager.getContactList();
  }

  getEmptyStore(): DataStore {
    return this.dataStoreManager.getEmptyStore();
  }

  getPeopleList(week: Date): WeeklyPeopleList {
    return this.dataStoreManager.getPeopleList(week);
  }

  getProjectList(week: Date): WeeklyProjectList {
    return this.dataStoreManager.getProjectList(week);
  }

  getWeeklyMasterList(
    week: Date,
    submittedOnly: boolean,
    customStore?: DataStore
  ): WeeklyData {
    return this.dataStoreManager.getWeeklyMasterList(
      week,
      submittedOnly,
      customStore
    );
  }

  importDataStore(store: DataStore) {
    this.dataStoreManager.importDataStore(store);
    this.#dataStoreSubject.next(this.dataStoreManager.dataStore as DataStore);
  }

  isDataStore(obj: DataStore | any): obj is DataStore {
    return (
      (obj as DataStore).master !== undefined &&
      (obj as DataStore).config !== undefined &&
      (obj as DataStore).people !== undefined &&
      (obj as DataStore).projects !== undefined
    );
  }

  saveContactList(list: ContactEntry[]) {
    this.dataStoreManager.saveContactList(list);
  }

  saveChangesToConfig(configChanges: ConfigChange[]) {
    return this.dataStoreManager.saveChangesToConfig(configChanges);
  }

  saveChangesToPeopleList(weekOf: Date, pdm: string, data: Person[]) {
    this.dataStoreManager.saveChangesToPeopleList(weekOf, pdm, data);
    this.#dataStoreSubject.next(this.dataStoreManager.dataStore as DataStore);
  }

  saveChangesToProjectList(weekOf: Date, data: Project[]) {
    this.dataStoreManager.saveChangesToProjectList(weekOf, data);
    this.#dataStoreSubject.next(this.dataStoreManager.dataStore as DataStore);
  }

  saveListForLookup(data: any) {
    this.dataStoreManager.saveListForLookup(data);
    this.#dataStoreSubject.next(this.dataStoreManager.dataStore as DataStore);
  }

  setDataStore(store: File | DataStore) {
    this.dataStoreManager.setDataStore(store);
  }

  storeMasterList(weekOf: Date, data: any) {
    this.dataStoreManager.storeMasterList(weekOf, data);
    this.#dataStoreSubject.next(this.dataStoreManager.dataStore as DataStore);
  }

  submitPeopleList(weekOf: Date, pdm: string, data: Person[]) {
    this.dataStoreManager.submitPeopleList(weekOf, pdm, data);
    this.#dataStoreSubject.next(this.dataStoreManager.dataStore as DataStore);
  }
}
