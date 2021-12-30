import { Injectable } from '@angular/core';
import { getDaysLeft } from 'src/app/shared-module/week-days/week';
import { Person, Tag } from 'src/app/people-list/person';
import { Week, getNewWeek } from 'src/app/shared-module/week-days/week';
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
    referenceDateStart?: Date,
    referenceDateEnd?: Date
  ): Person[] {
    const returnData = data
      .filter((entry: any) => {
        if (!referenceDateStart || !referenceDateEnd) {
          return entry;
        }
        const availabilityDate: number = Date.parse(entry['Availability date']);
        const skill: string = entry.Skill?.split(' - ')[0];

        return (
          availabilityDate >= referenceDateStart.getTime() &&
          availabilityDate <= referenceDateEnd.getTime() &&
          skill !== 'AP'
        );
      })
      .map((entry: any) => {
        const fmno: string = entry.FMNO;
        const name: string = entry.Name;
        const skill: string = entry.Skill?.split(' - ')[0];
        const week: Week = referenceDateStart
          ? getCalendarFromData(
              entry['Upcoming absences'],
              entry['Upcoming trainings'],
              referenceDateStart as Date,
              new Date(Date.parse(entry['Availability date']))
            )
          : getNewWeek();
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
          id: fmno,
          name,
          skill,
          availDate,
          week,
          daysLeft,
          tags,
          pdm,
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
}
