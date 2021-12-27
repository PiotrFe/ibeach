import { Week } from '../shared-module/week-days/week';
import { getWeekDayDate } from './index';

export const getNewAvailDate = (calendarObj: Week, refDate: Date): Date => {
  const refTime: number = refDate.getTime();
  const weekDays: string[] = Array.from(Object.keys(calendarObj));
  let offsetByDays: number = 0;

  for (let weekDay of weekDays) {
    if (!calendarObj[weekDay as keyof Week]) {
      offsetByDays++;
    } else {
      break;
    }
  }

  const newDate = new Date(refTime + 1000 * 60 * 60 * 24 * offsetByDays);
  return newDate.getDay() === 6 || newDate.getDay() === 0
    ? getWeekDayDate(1, 'next', newDate)
    : newDate;
};
