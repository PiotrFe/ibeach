import { Component, OnInit, NgZone } from '@angular/core';
import { FetchService } from '../../shared-module/fetch.service';
import { CsvParserService } from '../../shared-module/csv-parser.service';
import { ResizeObserverService } from 'src/app/shared-module/resize-observer.service';
import { parse } from '../../utils/csv-parser/index';
import { Person } from '../person';
import { PageComponent } from 'src/app/shared-module/page/page.component';
import { WeeklyData } from 'src/app/shared-module/fetch.service';

@Component({
  selector: 'upload-section',
  templateUrl: './upload-section.component.html',
  styleUrls: ['./upload-section.component.scss'],
})
export class UploadSectionComponent extends PageComponent implements OnInit {
  bsInlineValue: Date = new Date();
  referenceDateStart: Date = this.bsInlineValue;
  referenceDateEnd: Date = new Date(
    this.referenceDateStart.getTime() + 1000 * 60 * 60 * 24 * 5
  );
  fileSelected: boolean = false;
  data!: string;
  previewData: Person[] = [];
  fullData: Person[] = [];
  showUploadModal: boolean = false;

  constructor(
    ngZone: NgZone,
    resizeObserverService: ResizeObserverService,
    private fetchService: FetchService,
    private csvParserService: CsvParserService
  ) {
    super(ngZone, resizeObserverService);
  }

  setReferenceDate(date: Date) {
    this.referenceDateStart = date;
    this.referenceDateStart.setHours(0, 0, 0, 0);
    this.referenceDateEnd = new Date(
      this.referenceDateStart.getTime() + 1000 * 60 * 60 * 24 * 5
    );
    this.previewData = [];
    setTimeout(() => {
      this.fetchData();
    }, 0);
  }

  fetchData() {
    this.fetching = true;
    this.fetchError = '';
    this.noData = false;
    this.uploaded = false;

    this.fetchService.fetchWeeklyList(this.referenceDateStart).subscribe({
      next: (data: WeeklyData) => {
        const { people }: { people: Person[] } = data;
        this.previewData = people.sort(this.sortService.sortByName);
      },
      error: (e) => {
        console.log({ e });
        if (e.message === 'No data') {
          this.noData = true;
        } else {
          this.fetchError = e.message;
        }

        this.fetching = false;
      },
      complete: () => {
        this.fetching = false;
      },
    });
  }

  clearUploadStatus(): void {
    if (this.fetching) {
      this.fetchError = '';
    }
    if (this.uploaded) {
      this.uploaded = false;
    }
  }

  onFileSelected(event: any) {
    const file: File = event?.target.files[0];
    const reader = new FileReader();

    this.clearUploadStatus();

    reader.readAsText(file);
    reader.onload = () => {
      this.data = reader.result as string;

      parse(this.data, { columns: true }, (err, data) => {
        if (err) {
          console.log(err);
          this.fetchError = String(err);
        }
        this.fileSelected = true;
        this.previewData = this.csvParserService.parse(
          data,
          this.referenceDateStart,
          this.referenceDateEnd
        );
        this.noData = false;

        const parsed = this.csvParserService.parse(data);

        this.fullData = parsed;
      });
    };

    reader.onerror = () => {
      console.log(reader.error);
      this.fetchError = String(reader.error?.message);
    };
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
    this.uploading = true;

    this.fetchService
      .storeMasterList(this.referenceDateStart, {
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

  ngOnInit(): void {}
}
