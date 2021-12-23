import { Week } from './week';
import { PEOPLE } from './people';

export const SKILLS = ['EM', 'ASC', 'FELL', 'BA', 'INT'];

export interface Person {
  name: string;
  skill: string;
  week: Week;
  daysLeft: number;
  comments?: string;
}

export class PersonEntry {
  getTypeAhead(key: string): any[] {
    return PEOPLE.map((item) => item[key as keyof Person]);
  }
}
