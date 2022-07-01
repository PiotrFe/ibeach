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

  constructor() {
    this.dataStoreManager = new DataStoreManager();
  }

  get hasActiveDataStore(): boolean {
    return Boolean(this.dataStoreManager.dataStoreFile);
  }

  getEmptyStore(): DataStore {
    return this.dataStoreManager.getEmptyStore();
  }

  getWeeklyMasterList(week: Date, submittedOnly: boolean): WeeklyData {
    return this.dataStoreManager.getWeeklyMasterList(week, submittedOnly);
  }

  saveChangesToPeopleList(weekOf: Date, pdm: string, data: Person[]) {
    return this.dataStoreManager.saveChangesToPeopleList(weekOf, pdm, data);
  }

  saveListForLookup(data: any) {
    this.dataStoreManager.saveListForLookup(data);
  }

  setDataStore(file: File) {
    this.dataStoreManager.setDataStore(file);
  }

  storeMasterList(weekOf: Date, data: any) {
    this.dataStoreManager.storeMasterList(weekOf, data);
  }
}
