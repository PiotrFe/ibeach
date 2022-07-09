import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  NgZone,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { fromEvent, Observable, Subscription, debounceTime, pipe } from 'rxjs';
import { DataStoreService } from 'src/app/shared-module/data-store.service';
import { FetchService } from 'src/app/shared-module/fetch.service';
import { Filter } from 'src/app/shared-module/page/page.component';
import { IsOnlineService } from 'src/app/shared-module/is-online.service';
import { StatsEntry } from 'src/app/stats/stats-entry/stats-entry.component';
import { SortService } from 'src/app/utils/sortService';

const testData = [
  {
    client: 'Abba',
    days: {
      asked: 10,
      got: 6,
    },
    tags: ['ls', 'org'],
    leadership: [],
  },
  {
    client: 'Chinese',
    days: {
      asked: 100,
      got: 5,
    },
    tags: [],
  },
  {
    client: 'Bolonese',
    days: {
      asked: 100,
      got: 5,
    },
    tags: [],
  },
  {
    client: 'Dalmatene',
    days: {
      asked: 20,
      got: 20,
    },
    tags: [],
  },
];

@Component({
  selector: 'stats-section',
  templateUrl: './stats-section.component.html',
  styleUrls: ['./stats-section.component.scss'],
})
export class StatsSectionComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('searchBar') searchBar!: ElementRef;
  dateRange!: [Date, Date];
  entries: StatsEntry[] = [];
  fetchError!: string;
  fetching: boolean = false;
  filters: Filter[] = [];
  filteredEntries: StatsEntry[] = this.entries;
  searchSubscription!: Subscription;
  showCSTHeader: boolean = false;
  sortService: SortService = new SortService();
  splitByCST: boolean = false;

  constructor(
    private dataStoreService: DataStoreService,
    private fetchService: FetchService,
    private isOnlineService: IsOnlineService
  ) {}

  ngOnInit(): void {
    this.entries = this.sortService.applyCurrentSort(testData);
  }

  ngAfterViewInit(): void {
    this.searchSubscription = fromEvent<InputEvent>(
      this.searchBar.nativeElement,
      'input'
    )
      .pipe(debounceTime(600))
      .subscribe({
        next: (e: InputEvent) => {
          const { value } = e.target as HTMLInputElement;
          console.log(value);
        },
      });
  }

  ngOnDestroy(): void {
    this.searchSubscription.unsubscribe();
  }

  handleSort(colName: string) {
    this.entries = this.sortService.sortData(this.entries, colName);
    this.updateFilteredView();
  }

  onDateRangeChange(event: any): void {
    this.dateRange = event as [Date, Date];
  }

  onSubmit(): void {
    this.fetching = true;
    if (this.isOnlineService.isOnline) {
      this.#fetchFromOnlineStore();
    } else {
      this.#fetchFromOfflineStore();
    }
  }

  #fetchFromOnlineStore() {
    this.fetchService.fetchHistory(this.dateRange, this.splitByCST).subscribe({
      next: (data) => {
        const entries = Object.entries(data).map(([client, data]) => {
          const { days } = data;
          return {
            client,
            days,
          } as StatsEntry;
        });

        this.entries = this.sortService.applyCurrentSort(entries);
        this.showCSTHeader = this.splitByCST;
      },
      error: (err) => {
        this.fetchError = err;
        this.fetching = false;
      },
      complete: () => {
        this.fetching = false;
      },
    });
  }

  #fetchFromOfflineStore() {
    if (!this.dateRange) {
      return;
    }

    const data = this.dataStoreService.getAllocationHistory(
      this.dateRange[0],
      this.dateRange[1],
      this.splitByCST
    );

    this.entries = this.sortService.applyCurrentSort(data);
    this.showCSTHeader = this.splitByCST;
    this.fetching = false;
  }

  updateFilteredView(): void {
    this.filteredEntries = this.getFilteredView(this.entries);
  }

  getFilteredView(data: any[]): any[] {
    if (!this.filters.length) {
      return data;
    }

    return data.filter((entry) => {
      let daysLeftPass = true;
      let pdmPass = true;
      let skillPass = true;

      for (let filter of this.filters) {
        if (filter.field === 'days') {
          daysLeftPass = entry.daysLeft > 0;
        }
        if (filter.field === 'pdm') {
          pdmPass = entry.pdm === filter.value;
        }

        if (filter.field === 'skill') {
          pdmPass = entry.skill === filter.value;
        }
      }

      return daysLeftPass && pdmPass && skillPass;
    });
  }

  updateCSTView(e: any): void {
    this.splitByCST = e.target.checked;
  }
}
