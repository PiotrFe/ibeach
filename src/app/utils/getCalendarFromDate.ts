import { Week, getClearWeek } from '../shared-module/week-days/week';

export const getCalendarFromDate = (
  date: Date,
  calendarObj: Week,
  refDate?: Date
): Week => {
  if (refDate) {
    const datesOverlap = checkIfPeriodsOverlap(date, refDate);

    if (!datesOverlap) {
      return getClearWeek();
    }
  }

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

const checkIfPeriodsOverlap = (
  date: Date,
  refDate: Date,
  period: number = 5
): boolean => {
  const baseDate = new Date(date.setHours(0, 0, 0, 0));
  const referenceDate = new Date(refDate.setHours(0, 0, 0, 0));
  const baseDateTS = baseDate.getTime();
  const referenceDateTS = referenceDate.getTime();
  const offsetInMs = period * 24 * 60 * 60 * 1000;

  console.log({
    baseDate,
    referenceDate,
    offsetInMs,
    refPlusFive: new Date(referenceDateTS + offsetInMs),
  });

  return (
    baseDateTS >= referenceDateTS && baseDateTS <= referenceDateTS + offsetInMs
  );
};
