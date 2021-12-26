import { Week } from './week';
import { PEOPLE } from './people';
import { getTagArr } from '../utils/getTags';
import { isNgTemplate } from '@angular/compiler';

export const SKILLS = ['EM', 'ASC', 'FELL', 'BA', 'INT'];

export interface Tag {
  type: string;
  value: string;
}

export interface Person {
  name: string;
  skill: string;
  pdm?: string;
  availDate?: Date;
  week: Week;
  daysLeft: number;
  comments?: string;
  tags: Tag[];
}

export interface PersonEditable extends Person {
  id: string;
  inEditMode: boolean;
}

export class PersonEntry {
  getTypeAhead(key: string): any[] {
    return PEOPLE.map((item) => item[key as keyof Person]);
  }
  getTagTypeAhead(): any[] {
    return getTagArr().map((item) => item.value);
  }
}
