import { Week } from '../shared-module/week-days/week';

export const getCalendarFromDate = (date: Date, calendarObj: Week): Week => {
  const day: number = date.getDay();
  const keys: string[] = ['', ...Array.from(Object.keys(calendarObj))];
  const newCalendar: Week = {
    ...calendarObj,
  };

  for (let i = 1; i < keys.length; i++) {
    if (i < day) {
      newCalendar[keys[i] as keyof Week] = false;
    } else {
      newCalendar[keys[i] as keyof Week] = true;
    }
  }

  return newCalendar;
};
