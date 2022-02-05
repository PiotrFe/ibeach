import { Component, OnInit, NgZone } from '@angular/core';
import { PageComponent } from 'src/app/shared-module/page/page.component';
import { ResizeObserverService } from 'src/app/shared-module/resize-observer.service';
import { FetchService } from 'src/app/shared-module/fetch.service';

@Component({
  selector: 'stats-section',
  templateUrl: './stats-section.component.html',
  styleUrls: ['./stats-section.component.scss'],
})
export class StatsSectionComponent extends PageComponent implements OnInit {
  previewData: any[] = [];
  dateRange!: [Date, Date];

  constructor(
    ngZone: NgZone,
    resizeObserverService: ResizeObserverService,
    private fetchService: FetchService
  ) {
    super(ngZone, resizeObserverService);
  }

  ngOnInit(): void {}
  onSubmit(): void {
    this.fetchService.fetchHistory(this.dateRange).subscribe({
      next: () => {},
      error: () => {},
    });
  }

  onDateRangeChange(event: any): void {
    this.dateRange = event as [Date, Date];
    console.log(this.dateRange);
  }
}
