import { Subject } from 'rxjs';
import { Injectable } from '@angular/core';
import { Person } from 'src/app/people-list/person';
import { WeeklyData } from 'src/app/shared-module/fetch.service';
import {
  DataStoreManager,
  StoreManager,
  DataStore,
} from '../utils/StorageManager';

@Injectable({
  providedIn: 'root',
})
export class DataStoreService {
  dataStoreManager!: StoreManager;
  #dataStoreSubject: Subject<DataStore> = new Subject<DataStore>();
  storeData$ = this.#dataStoreSubject.asObservable();

  constructor() {
    this.dataStoreManager = new DataStoreManager();
  }

  get hasActiveDataStore(): boolean {
    return Boolean(this.dataStoreManager.dataStoreFile);
  }

  getEmptyStore(): DataStore {
    return this.dataStoreManager.getEmptyStore();
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

  saveChangesToPeopleList(weekOf: Date, pdm: string, data: Person[]) {
    this.dataStoreManager.saveChangesToPeopleList(weekOf, pdm, data);
    this.#dataStoreSubject.next(this.dataStoreManager.dataStore as DataStore);
  }

  saveListForLookup(data: any) {
    this.dataStoreManager.saveListForLookup(data);
    this.#dataStoreSubject.next(this.dataStoreManager.dataStore as DataStore);
  }

  setDataStore(file: File) {
    this.dataStoreManager.setDataStore(file);
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
