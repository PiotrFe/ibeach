import { Week } from './week';
import { PEOPLE } from './people';
import { getTagArr } from '../utils/';

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
  showAddTag: boolean = false;

  getTypeAhead(key: string): any[] {
    if (key === 'pdm') {
      return this.getPDMTypeAhead(key);
    }
    if (key === 'tag') {
      return this.getTagTypeAhead(key);
    }

    return [];
  }

  getPDMTypeAhead(key: string): any[] {
    return PEOPLE.map((item) => item[key as keyof Person]);
  }
  getTagTypeAhead(key: string): any[] {
    return getTagArr().map((item) => item.value);
  }

  setShowAddTag(show: boolean): void {
    this.showAddTag = show;
  }
}
