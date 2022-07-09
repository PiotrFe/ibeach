import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  NgZone,
  ElementRef,
  ViewChild,
} from '@angular/core';
import {
  fromEvent,
  Observable,
  Subscription,
  debounceTime,
  pipe,
  startWith,
  distinctUntilChanged,
  switchMap,
  map,
  tap,
} from 'rxjs';
import { DataStoreService } from 'src/app/shared-module/data-store.service';
import { FetchService } from 'src/app/shared-module/fetch.service';
import { Filter } from 'src/app/shared-module/page/page.component';
import { IsOnlineService } from 'src/app/shared-module/is-online.service';
import { StatsEntry } from 'src/app/stats/stats-entry/stats-entry.component';
import { SortService } from 'src/app/utils/sortService';
import { TypeaheadService } from 'src/app/shared-module/typeahead.service';

@Component({
  selector: 'stats-section',
  templateUrl: './stats-section.component.html',
  styleUrls: ['./stats-section.component.scss'],
})
export class StatsSectionComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('searchInput') searchInput!: ElementRef;
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
  typeaheadList: any[] = [];

  constructor(
    private dataStoreService: DataStoreService,
    private fetchService: FetchService,
    private isOnlineService: IsOnlineService,
    private typeaheadService: TypeaheadService
  ) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.searchSubscription = fromEvent<any>(
      this.searchInput.nativeElement,
      'input'
    )
      .pipe(
        tap(() => (this.typeaheadList = [])),
        map((e) => e.target.value),
        startWith(''),
        debounceTime(500),
        distinctUntilChanged()
      )
      .pipe(
        switchMap((text) =>
          this.typeaheadService.getTypeahead(
            this.typeaheadService.fields.Stats,
            text
          )
        )
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.searchSubscription.unsubscribe();
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

  updateCSTView(e: any): void {
    this.splitByCST = e.target.checked;
  }

  updateFilteredView(): void {
    this.filteredEntries = this.getFilteredView(this.entries);
  }
}
