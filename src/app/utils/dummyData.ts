import { getNewWeek } from 'src/app/shared-module/week-days/week';
import { ProjectEditable } from 'src/app/project-list/project-list/project';
import { Person, PersonEditable } from 'src/app/people-list/person';

export const personDataBasic: Person[] = [
  {
    id: 'a',
    name: 'Peter Smith',
    skill: 'manager',
    week: getNewWeek(),
    daysLeft: 5,
    tags: [],
  },
  {
    id: 'b',
    name: 'Mary Bane',
    skill: 'secretary',
    week: getNewWeek(),
    daysLeft: 5,
    tags: [],
  },
  {
    id: 'c',
    name: 'Kay Heid',
    skill: 'accountant',
    week: getNewWeek(),
    daysLeft: 5,
    tags: [],
  },
];

export const personData: PersonEditable[] = [
  {
    id: 'a',
    name: 'Peter Smith',
    skill: 'manager',
    week: getNewWeek(),
    daysLeft: 5,
    tags: [],
    inEditMode: false,
    pdm: 'John Wayne',
    comments: 'Comment on Peter',
  },
  {
    id: 'b',
    name: 'Mary Bane',
    skill: 'secretary',
    week: getNewWeek(),
    daysLeft: 5,
    tags: [],
    inEditMode: false,
  },
  {
    id: 'c',
    name: 'Kay Heid',
    skill: 'accountant',
    week: getNewWeek(),
    daysLeft: 5,
    tags: [],
    inEditMode: false,
  },
];

export const projectData: ProjectEditable[] = [
  {
    id: '1',
    client: 'client 1',
    type: 'lop',
    week: getNewWeek(),
    daysLeft: 5,
    leadership: ['John Smith'],
    tags: [],
    inEditMode: false,
  },
  {
    id: '2',
    client: 'client 2',
    type: 'lop',
    week: getNewWeek(),
    daysLeft: 5,
    leadership: ['Steve Parker'],
    tags: [],
    inEditMode: false,
  },
  {
    id: '3',
    client: 'client 3',
    type: 'lop',
    week: getNewWeek(),
    daysLeft: 5,
    leadership: ['Mary Car'],
    tags: [],
    inEditMode: false,
  },
];
