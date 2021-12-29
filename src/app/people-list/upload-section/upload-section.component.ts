import { Component, OnInit } from '@angular/core';
import { FetchService } from '../../shared-module/fetch.service';
import { CsvParserService } from '../../shared-module/csv-parser.service';
import { parse } from '../../utils/csv-parser/index';
import { PersonEditable } from '../person';

@Component({
  selector: 'upload-section',
  templateUrl: './upload-section.component.html',
  styleUrls: ['./upload-section.component.scss'],
})
export class UploadSectionComponent implements OnInit {
  bsInlineValue: Date = new Date();
  referenceDateStart: Date = this.bsInlineValue;
  referenceDateEnd: Date = new Date(
    this.referenceDateStart.getTime() + 1000 * 60 * 60 * 24 * 5
  );
  fileSelected: boolean = false;
  data!: string;
  previewData: PersonEditable[] = [];
  showUploadModal: boolean = false;
  uploading: boolean = false;
  uploaded: boolean = false;
  uploadError: string = '';

  constructor(
    private fetchService: FetchService,
    private csvParserService: CsvParserService
  ) {}

  setReferenceDate(date: Date) {
    console.log({ date });
    this.referenceDateStart = date;
    this.referenceDateStart.setHours(0, 0, 0, 0);
    this.referenceDateEnd = new Date(
      this.referenceDateStart.getTime() + 1000 * 60 * 60 * 24 * 5
    );
  }

  clearUploadStatus(): void {
    if (this.uploadError) {
      this.uploadError = '';
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
          this.uploadError = String(err);
        }
        this.fileSelected = true;
        this.previewData = this.csvParserService.parse(
          data,
          this.referenceDateStart,
          this.referenceDateEnd
        );
      });
    };

    reader.onerror = () => {
      console.log(reader.error);
      this.uploadError = String(reader.error?.message);
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
        JSON.stringify(
          this.previewData.map((person) => {
            const { inEditMode, ...otherProps } = person;

            return {
              ...otherProps,
            };
          })
        )
      );
      this.uploaded = true;
    } catch (e: any) {
      this.uploadError = e.message;
    } finally {
      this.uploading = false;
    }
  }

  ngOnInit(): void {}
}
