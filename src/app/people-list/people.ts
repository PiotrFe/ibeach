import { Person } from './person';
import { getDaysLeft } from '../shared-module/week-days/week';

export const PEOPLE: Person[] = [
  {
    name: 'Piotr',
    skill: 'ASC',
    week: { mon: false, tue: true, wed: false, thu: true, fri: true },
    comments: 'DnA',
    daysLeft: getDaysLeft({
      mon: false,
      tue: true,
      wed: false,
      thu: true,
      fri: true,
    }),
  },
  {
    name: 'Mark',
    skill: 'EM',
    week: { mon: true, tue: true, wed: true, thu: true, fri: true },
    comments: "Doctor's visit on Fri",
    daysLeft: getDaysLeft({
      mon: true,
      tue: true,
      wed: true,
      thu: true,
      fri: true,
    }),
  },
  {
    name: 'Todd',
    skill: 'EM',
    week: { mon: true, tue: true, wed: true, thu: true, fri: false },
    comments: "Doctor's visit on Fri",
    daysLeft: getDaysLeft({
      mon: true,
      tue: true,
      wed: true,
      thu: true,
      fri: false,
    }),
  },
  {
    name: 'Tom',
    skill: 'BA',
    week: { mon: true, tue: true, wed: true, thu: true, fri: true },
    daysLeft: getDaysLeft({
      mon: true,
      tue: true,
      wed: true,
      thu: true,
      fri: true,
    }),
  },
  {
    name: 'Tom',
    skill: 'EM',
    week: { mon: false, tue: false, wed: false, thu: false, fri: false },
    daysLeft: getDaysLeft({
      mon: false,
      tue: false,
      wed: false,
      thu: false,
      fri: false,
    }),
  },
];
