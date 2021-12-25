import { Week } from './week';
import { PEOPLE } from './people';

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

export class PersonEntry {
  getTypeAhead(key: string): any[] {
    return PEOPLE.map((item) => item[key as keyof Person]);
  }
}
