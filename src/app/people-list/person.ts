import { Week } from './week';

export const SKILLS = ['EM', 'ASC', 'FELL', 'BA', 'INT'];

export interface Person {
  name: string;
  skill: string;
  week: Week;
  comments?: string;
}
