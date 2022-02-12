import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ListEditModeStatusService {
  listEditModeStatus: {
    people: boolean;
    projects: boolean;
  } = {
    people: false,
    projects: false,
  };

  constructor() {}

  onRefDateChange(): void {
    this.listEditModeStatus.people = false;
    this.listEditModeStatus.projects = false;
  }

  onEnterEditMode(listType: 'people' | 'projects'): void {
    this.listEditModeStatus[listType] = true;
  }

  onExitEditMode(listType: 'people' | 'projects'): void {
    this.listEditModeStatus[listType] = false;
  }

  isEditModeOpen(): boolean {
    return (
      this.listEditModeStatus['people'] || this.listEditModeStatus['projects']
    );
  }
}
