import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  NgZone,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { FetchService } from 'src/app/shared-module/fetch.service';
import { StatsEntry } from 'src/app/stats/stats-entry/stats-entry.component';
import { SortService } from 'src/app/utils/sortService';
import { Filter } from 'src/app/shared-module/page/page.component';
import { fromEvent, Observable, Subscription, debounceTime, pipe } from 'rxjs';

const testData = [
  {
    client: 'Abba',
    days: {
      asked: 10,
      got: 6,
    },
    tags: [],
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
  entries: StatsEntry[] = [];
  filteredEntries: StatsEntry[] = this.entries;
  dateRange!: [Date, Date];
  sortService: SortService = new SortService();
  fetchError!: string;
  filters: Filter[] = [];
  fetching: boolean = false;
  searchSubscription!: Subscription;
  cstView: boolean = false;

  constructor(ngZone: NgZone, private fetchService: FetchService) {}

  ngOnInit(): void {
    this.entries = this.sortService.applyCurrentSort(testData);
  }

  updateCSTView(e: any): void {
    this.cstView = e.target.checked;
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
  onSubmit(): void {
    this.fetching = true;
    this.fetchService.fetchHistory(this.dateRange, this.cstView).subscribe({
      next: (data) => {
        const entries = Object.entries(data).map(([client, data]) => {
          const { days } = data;
          return {
            client,
            days,
          } as StatsEntry;
        });

        this.entries = this.sortService.applyCurrentSort(entries);
        console.log(this.entries);
      },
      error: (err) => {
        this.fetchError = err;
      },
      complete: () => {
        this.fetching = false;
      },
    });
  }

  onDateRangeChange(event: any): void {
    this.dateRange = event as [Date, Date];
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

  handleSort(colName: string) {
    this.entries = this.sortService.sortData(this.entries, colName);
    this.updateFilteredView();
  }
}
