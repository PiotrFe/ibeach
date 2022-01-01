import { Component } from '@angular/core';
import { fakeAsync } from '@angular/core/testing';
import { Person } from 'src/app/people-list/person';

export interface Filter {
  field: string;
  value?: string;
}

export interface SubmissionStatus {
  pending: string[];
  done: string[];
}

@Component({
  template: '',
})
export class PageComponent {
  fetching: boolean = false;
  fetchError: string = '';
  uploading: boolean = false;
  uploaded: boolean = false;
  noData: boolean = false;
  filters: Filter[] = [];
  uncollapsed: Set<string> = new Set();

  constructor() {}

  updateFilter(field: string, value: string) {
    this.filters = this.filters.filter(
      (filter: Filter) => filter.field !== field
    );

    if (field !== 'All') {
      this.filters.push({
        field,
        value,
      });
    }
  }

  getFilteredView(data: any[]): any[] {
    if (!this.filters.length) {
      return data;
    }

    return data.filter((entry) => {
      let daysLeftPass = true;
      let pdmPass = true;

      for (let filter of this.filters) {
        if (filter.field === 'days') {
          daysLeftPass = entry.daysLeft > 0;
        }
        if (filter.field === 'pdm') {
          pdmPass = entry.pdm === filter.value;
        }
      }

      return daysLeftPass && pdmPass;
    });
  }

  getClearFilterBtnClass(): string {
    const baseClass = 'bi bi-x-circle-fill fs-12';
    const otherClasses = [];
    if (this.filters.length) {
      otherClasses.push(' clickable');
    } else {
      otherClasses.push(' btn-inactive');
      otherClasses.push('btn-greyed-out');
    }

    const otherClsStr = otherClasses.join(' ');
    return `${baseClass}${otherClsStr}`;
  }

  handleCollapse(event: { id: string; collapsed: boolean }): void {
    const { id, collapsed } = event;
    const newVal = !collapsed;

    if (!newVal) {
      this.uncollapsed.delete(id);
    } else {
      this.uncollapsed.add(id);
    }
  }
  isCollapsed(id: string): boolean {
    return !this.uncollapsed.has(id);
  }
}
