import { Component, OnInit } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { TypeaheadOptions } from 'ngx-bootstrap/typeahead';
import { getDaysLeft, getNewWeek } from 'src/app/shared-module/week-days/week';
import { parse } from '../../utils/csv-parser/index';
import { PersonEditable, Tag } from '../person';
import { Week } from '../week';
import {
  getTagsFromData,
  sortTags,
  getAffiliations,
  clearTagDuplicates,
} from '../../utils';

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
  previewData: PersonEditable[] = [];

  constructor() {}

  setReferenceDate(date: Date) {
    this.referenceDateStart = date;
    this.referenceDateStart.setHours(0, 0, 0, 0);
    this.referenceDateEnd = new Date(
      this.referenceDateStart.getTime() + 1000 * 60 * 60 * 24 * 7
    );
  }

  parseData(data: any): PersonEditable[] {
    const returnData = data
      .filter((entry: any) => {
        const availabilityDate: number = Date.parse(entry['Availability date']);
        const skill: string = entry.Skill?.split(' - ')[0];

        return (
          availabilityDate >= this.referenceDateStart.getTime() &&
          availabilityDate <= this.referenceDateEnd.getTime() &&
          skill !== 'AP'
        );
      })
      .map((entry: any) => {
        const name: string = entry.Name;
        const skill: string = entry.Skill?.split(' - ')[0];
        const week: Week = getNewWeek();
        const daysLeft: number = getDaysLeft(week);
        const indTags = clearTagDuplicates([
          ...getTagsFromData(entry['Sector experience'], 'ind'),
          ...getAffiliations(entry['Core industry affiliations'], 'ind'),
        ]);

        const funTags = clearTagDuplicates([
          ...getTagsFromData(entry['Functional experience'], 'fun'),
          ...getAffiliations(entry['Core industry affiliation'], 'fun'),
          ...getAffiliations(entry['Core growth platform affiliation'], 'fun'),
        ]);

        const tags: Tag[] = sortTags([...indTags, ...funTags]);
        const availDate: Date = new Date(
          Date.parse(entry['Availability date'])
        );
        const pdm: string = entry['Staffing manager'];

        return {
          id: uuidv4(),
          name,
          skill,
          availDate,
          week,
          daysLeft,
          tags,
          pdm,
          inEditMode: false,
        };
      })
      .sort((a: PersonEditable, b: PersonEditable) => {
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
