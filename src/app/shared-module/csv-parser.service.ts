import { Injectable } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { getDaysLeft } from 'src/app/shared-module/week-days/week';
import { PersonEditable, Tag } from 'src/app/people-list/person';
import { Week } from 'src/app/people-list/week';
import {
  getTagsFromData,
  sortTags,
  getAffiliations,
  clearTagDuplicates,
  getCalendarFromData,
} from '../utils';

@Injectable({
  providedIn: 'root',
})
export class CsvParserService {
  constructor() {}

  parse(
    data: any,
    referenceDateStart: Date,
    referenceDateEnd: Date
  ): PersonEditable[] {
    const returnData = data
      .filter((entry: any) => {
        const availabilityDate: number = Date.parse(entry['Availability date']);
        const skill: string = entry.Skill?.split(' - ')[0];

        return (
          availabilityDate >= referenceDateStart.getTime() &&
          availabilityDate <= referenceDateEnd.getTime() &&
          skill !== 'AP'
        );
      })
      .map((entry: any) => {
        const name: string = entry.Name;
        const skill: string = entry.Skill?.split(' - ')[0];
        const week: Week = getCalendarFromData(
          entry['Upcoming absences'],
          entry['Upcoming trainings'],
          referenceDateStart,
          new Date(Date.parse(entry['Availability date']))
        );
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
}
