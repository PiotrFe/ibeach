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
  bsInlineValue: Date = new Date();
  referenceDateStart: Date = this.bsInlineValue;
  referenceDateEnd!: Date;
  uploadError!: string;
  fileSelected: boolean = false;
  previewData: Person[] = [];

  constructor() {}

  setReferenceDate(date: Date) {
    // correct reference period to always cover midnight-midnight
    this.referenceDateStart = date;
    this.referenceDateEnd = new Date(
      this.referenceDateStart.getTime() + 1000 * 60 * 60 * 24 * 7
    );

    console.log({
      from: this.referenceDateStart,
      to: this.referenceDateEnd,
    });
  }

  parseData(data: any): Person[] {
    const returnData = data
      .filter((entry: any) => {
        const availabilityDate = Date.parse(entry['Availability date']);

        return (
          availabilityDate >= this.referenceDateStart.getTime() &&
          availabilityDate <= this.referenceDateEnd.getTime()
        );
      })
      .map((entry: any) => {
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
      })
      .sort((a: Person, b: Person) => {
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
        console.log({
          data,
        });
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
