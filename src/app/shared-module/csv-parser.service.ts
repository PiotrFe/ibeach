import { Injectable } from '@angular/core';
import { getDaysLeft } from 'src/app/shared-module/week-days/week';
import { Person } from 'src/app/people-list/person';
import { Week, getNewWeek } from 'src/app/shared-module/week-days/week';
import { Tag } from 'src/app/shared-module/entry/entry.component';
import { parse } from 'src/app/utils/csv-parser/index';
import {
  getTagsFromData,
  sortTags,
  getAffiliations,
  clearTagDuplicates,
  getCalendarFromData,
} from '../utils';

import { ContactEntry } from 'src/app/utils/StorageManager';

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

  parseContacts = (data: any, cb: Function): void => {
    parse(
      data,
      { encoding: 'utf8', columns: true, relaxColumnCount: true },
      (err, data) => {
        if (err) {
          console.log(err);
          throw new Error(err.message);
        }

        this._mapContacts(data, cb);
      }
    );
  };
  _mapContacts = (data: any, cb: Function): void => {
    const returnVal: ContactEntry[] = data.map((entry: any): ContactEntry => {
      const firstNameKey = Object.keys(entry).find((key: string) => {
        return key.toLowerCase().includes('first');
      });
      const lastNameKey = Object.keys(entry).find((key: string) => {
        return key.toLowerCase().includes('last');
      });
      const emailKey = Object.keys(entry).find((key: string) => {
        return (
          key.toLowerCase().includes('email') ||
          key.toLowerCase().includes('address')
        );
      });

      const returnObj = {
        first: entry[firstNameKey as keyof typeof entry],
        last: entry[lastNameKey as keyof typeof entry],
        email: entry[emailKey as keyof typeof entry],
      };

      return returnObj;
    });
    cb(returnVal);
  };
}
