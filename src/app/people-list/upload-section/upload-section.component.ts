import { Component, OnInit } from '@angular/core';
import { TypeaheadOptions } from 'ngx-bootstrap/typeahead';
import { getDaysLeft, getNewWeek } from 'src/app/shared-module/week-days/week';
import { parse } from '../../utils/csv-parser/index';
import { Person, Tag } from '../person';
import { Week } from '../week';

@Component({
  selector: 'upload-section',
  templateUrl: './upload-section.component.html',
  styleUrls: ['./upload-section.component.scss'],
})
export class UploadSectionComponent implements OnInit {
  bsInlineValue = new Date();
  uploadError!: string;
  fileSelected: boolean = false;
  previewData: Person[] = [];

  constructor() {}

  parseData(data: any): Person[] {
    const returnData = data.map((entry: any) => {
      const name: string = entry.Name;
      const skill: string = entry.Skill?.split(' - ')[0];
      const week: Week = getNewWeek();
      const daysLeft: number = getDaysLeft(week);
      const tags: Tag[] = [];

      return {
        name,
        skill,
        week,
        daysLeft,
        tags,
      };
    });

    return returnData;
  }

  onFileSelected(event: any) {
    const file: File = event?.target.files[0];
    const reader = new FileReader();

    reader.readAsText(file);

    reader.onload = () => {
      const list = reader.result as string;

      parse(list, { columns: true }, (err, data) => {
        if (err) {
          console.log(err);
          this.uploadError = String(err);
        }
        this.fileSelected = true;
        this.previewData = this.parseData(data);
      });
    };

    reader.onerror = () => {
      console.log(reader.error);
      this.uploadError = String(reader.error?.message);
    };
  }

  ngOnInit(): void {}
}
