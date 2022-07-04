import { Component, NgZone, OnChanges, SimpleChanges } from '@angular/core';
import { ConfigService } from 'src/app/shared-module/config.service';
import { CsvParserService } from 'src/app/shared-module/csv-parser.service';
import { DataStoreService } from 'src/app/shared-module/data-store.service';
import { FetchService } from 'src/app/shared-module/fetch.service';
import { IsOnlineService } from 'src/app/shared-module/is-online.service';
import { ResizeObserverService } from 'src/app/shared-module/resize-observer.service';
import { parse } from 'src/app/utils/csv-parser/index';
import { Person } from '../person';
import { PageComponent } from 'src/app/shared-module/page/page.component';
import { WeeklyData } from 'src/app/shared-module/fetch.service';

@Component({
  selector: 'upload-section',
  templateUrl: './upload-section.component.html',
  styleUrls: ['./upload-section.component.scss'],
})
export class UploadSectionComponent extends PageComponent implements OnChanges {
  bsInlineValue: Date = new Date();
  data!: string;
  fileSelected: boolean = false;
  fullData: Person[] = [];
  previewData: Person[] = [];
  referenceDateEnd: Date = new Date();
  showUploadModal: boolean = false;

  constructor(
    ngZone: NgZone,
    resizeObserverService: ResizeObserverService,
    private configService: ConfigService,
    private csvParserService: CsvParserService,
    private dataStoreService: DataStoreService,
    private fetchService: FetchService,
    private isOnlineService: IsOnlineService
  ) {
    super(ngZone, resizeObserverService);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['referenceDate']) {
      const { currentValue } = changes['referenceDate'];
      const mil = currentValue.getMilliseconds();
      const secs = currentValue.getSeconds();
      if (mil === 0 && secs === 0) {
        this.handleDateChange(currentValue as Date);
      }
    }
  }

  handleDateChange(date: Date) {
    this.onDateChange(date);
    this.referenceDateEnd = new Date(
      this.referenceDate.getTime() + 1000 * 60 * 60 * 24 * 5
    );
    this.previewData = [];
    this.fetchData();
  }

  fetchData() {
    this.fetching = true;
    this.fetchError = '';
    this.uploaded = false;

    if (this.isOnlineService.isOnline) {
      this._fetchDataFromOnlineStore();
    } else {
      this._fetchDataFromLocalStore();
    }
  }

  _fetchDataFromOnlineStore() {
    this.fetchService.fetchWeeklyList(this.referenceDate, true).subscribe({
      next: (data: WeeklyData) => {
        const { people }: { people: Person[] } = data;
        this.previewData = !people?.length
          ? []
          : people.sort(this.sortService.sortByName);
      },
      error: (e) => {
        this.fetchError = e.message;
        this.fetching = false;
      },
      complete: () => {
        this.fetching = false;
      },
    });
  }

  _fetchDataFromLocalStore() {
    const ts = this.referenceDate.getTime();
    this.fetching = false;
    // this.previewData =
  }

  clearUploadStatus(): void {
    this.fetchError = '';
    this.uploaded = false;
    this.fileSelected = false;
  }

  onFileSelected(event: any) {
    const file: File = event?.target.files[0];
    const reader = new FileReader();

    this.clearUploadStatus();

    reader.readAsText(file);
    reader.onload = () => {
      this.data = reader.result as string;

      parse(
        this.data,
        { encoding: 'utf8', columns: true, relaxColumnCount: true },
        (err, data) => {
          if (err) {
            console.log(err);
            this.fetchError = String(err);
          }
          this.fileSelected = true;
          const parsedPreview = this.csvParserService.parse(
            data,
            this.referenceDate,
            this.referenceDateEnd
          );
          this.previewData = parsedPreview.filter(({ pdm }) =>
            this.configService.getPDMs().includes((pdm as string).toLowerCase())
          );
          const parsedFull = this.csvParserService.parse(data);
          this.fullData = parsedFull;
        }
      );
    };

    reader.onerror = () => {
      this.fetchError = String(reader.error?.message);
    };
    event.target.value = '';
  }

  // *****************
  // SUBMIT HANDLERS
  // *****************
  onSubmit() {
    this.clearUploadStatus();
    this.showUploadModal = true;
  }
  handleModalClose(submit: boolean) {
    this.showUploadModal = false;
    if (submit) {
      this.uploadData();
    }
  }

  uploadData() {
    if (this.isOnlineService.isOnline) {
      this._storeDataOnline();
    } else {
      this._storeDataLocally();
    }
  }

  _storeDataOnline() {
    this.uploading = true;

    this.fetchService
      .storeMasterList(this.referenceDate, {
        week: this.previewData,
        full: this.fullData,
      })
      .subscribe({
        next: () => {
          this.uploaded = true;
        },
        error: (e) => {
          console.log({ e });
          this.fetchError = e.message;
          this.uploading = false;
        },
        complete: () => {
          this.uploading = false;
        },
      });
  }

  _storeDataLocally() {
    this.dataStoreService.storeMasterList(this.referenceDate, {
      week: this.previewData,
      full: this.fullData,
    });
  }
}
