import { Component, OnInit } from '@angular/core';
import { FetchService } from '../../shared-module/fetch.service';
import { CsvParserService } from '../../shared-module/csv-parser.service';
import { parse } from '../../utils/csv-parser/index';
import { Person, PersonEntry } from '../person';
import { PageComponent } from 'src/app/shared-module/page/page.component';

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
    private fetchService: FetchService,
    private csvParserService: CsvParserService
  ) {
    super();
  }

  setReferenceDate(date: Date) {
    this.referenceDateStart = date;
    this.referenceDateStart.setHours(0, 0, 0, 0);
    this.referenceDateEnd = new Date(
      this.referenceDateStart.getTime() + 1000 * 60 * 60 * 24 * 5
    );
    this.previewData = [];
    this.fetchData();
  }

  async fetchData() {
    this.fetching = true;
    this.fetchError = '';
    this.noData = false;
    this.uploaded = false;

    try {
      const response = await this.fetchService.fetchWeeklyList(
        this.referenceDateStart
      );

      const { people }: { people: Person[] } = response;

      this.previewData = people.sort((a: Person, b: Person) => {
        const nameA = a.name.toUpperCase();
        const nameB = b.name.toUpperCase();

        if (nameA < nameB) {
          return -1;
        }
        if (nameA > nameB) {
          return 1;
        }
        return 0;
      });
    } catch (e: any) {
      if (e.message === 'Error: No data') {
        this.noData = true;
      } else {
        this.fetchError = e.message;
      }
    } finally {
      this.fetching = false;
    }
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

  async uploadData() {
    this.uploading = true;

    try {
      await this.fetchService.storeMasterList(
        this.referenceDateStart,
        JSON.stringify({ week: this.previewData, full: this.fullData })
      );
      this.uploaded = true;
    } catch (e: any) {
      this.fetchError = e.message;
    } finally {
      this.uploading = false;
    }
  }

  ngOnInit(): void {}
}
