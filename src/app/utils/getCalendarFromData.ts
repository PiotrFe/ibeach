import { Week } from 'src/app/shared-module/week-days/week';
import { getNewWeek } from '../shared-module/week-days/week';
import { getCalendarFromDate } from './index';

export const getCalendarFromData = (
  absences: string,
  trainings: string,
  weekOf: Date,
  availFrom?: Date
): Week => {
  const availableFrom = availFrom || weekOf;
  const weekObj = getNewWeek();
  const calendarObj = getCalendarFromDate(availableFrom, weekObj, weekOf);
  const weekDaysArr: string[] = Object.keys(calendarObj);

  if (!absences && !trainings) {
    return calendarObj;
  }

  // Get the starting ts
  const startTS = weekOf.setHours(0, 0, 0, 0);
  const dayInMs = 24 * 60 * 60 * 1000;
  const weekTSArray: number[] = [startTS];

  for (let i = 1; i < 5; i++) {
    // Push ts for four remaining days of the week
    weekTSArray.push(startTS + i * dayInMs);
  }

  // Create an array of strings containing absences
  const absenceArr = [...absences.split('; '), ...trainings.split('; ')].filter(
    (subArr) => subArr.length > 0
  );

  // Loop through the array of strings
  absenceArr.forEach((absence) => {
    // Get start ts and end ts
    const [from, to] = absence.split(' to ');
    const brackets = /\(|\)/;
    let fromTS: number = new Date(
      Date.parse(from.replace(brackets, ''))
    ).getTime();
    let toTS: number = new Date(Date.parse(to.replace(brackets, ''))).getTime();
    const absenceTSArr: number[] = [fromTS];

    // If the absence starts after or ends before the current week, skip
    if (fromTS > weekTSArray[4] || toTS < weekTSArray[0]) {
      return;
    }

    // Get ts for all days between start and end date
    while (fromTS < toTS) {
      fromTS += dayInMs;
      absenceTSArr.push(fromTS);
    }

    // Loop through those ts and check how many of them overlap with
    // the current week
    absenceTSArr.forEach((absenceTS) => {
      const index = weekTSArray.findIndex((weekTs) => weekTs === absenceTS);

      if (index >= 0) {
        // for those that do, mark the day in calendar as unavailable
        const weekDay = weekDaysArr[index];
        calendarObj[weekDay as keyof Week] = false;
      }
    });
  });

  return calendarObj;
};
