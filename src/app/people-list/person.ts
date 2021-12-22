import { Week } from './week';
import { PEOPLE } from './people';

export const SKILLS = ['EM', 'ASC', 'FELL', 'BA', 'INT'];

export interface Person {
  name: string;
  skill: string;
  week: Week;
  comments?: string;
}

export class PersonEntry {
  daysLeft!: number;

  getTypeAhead(key: string): any[] {
    return PEOPLE.map((item) => item[key as keyof Person]);
  }

  getDaysAvailable(): number {
    return this.daysLeft;
  }
}
