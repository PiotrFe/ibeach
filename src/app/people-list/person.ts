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
  daysLeft: number = 5;

  getTypeAhead(key: string): any[] {
    return PEOPLE.map((item) => item[key as keyof Person]);
  }

  onDaysLeft(count: number): void {
    this.daysLeft = count;
  }

  getDaysAvailable(): number {
    return this.daysLeft;
  }
}
