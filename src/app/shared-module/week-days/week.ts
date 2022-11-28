import { isDayInPast } from './week-days.component';

export type WeekEntry = boolean | { id: string; text: string; skill?: string };

export interface Week {
  mon: WeekEntry;
  tue: WeekEntry;
  wed: WeekEntry;
  thu: WeekEntry;
  fri: WeekEntry;
}

const newWeek: Week = {
  mon: true,
  tue: true,
  wed: true,
  thu: true,
  fri: true,
};

const clearWeek: Week = {
  mon: false,
  tue: false,
  wed: false,
  thu: false,
  fri: false,
};

export const getNewWeek = (): Week => {
  return {
    ...newWeek,
  };
};

export const getClearWeek = (): Week => {
  return {
    ...clearWeek,
  };
};

export const getDaysLeft = (
  weekObj: Week,
  excludePast = false,
  referenceDate: Date | undefined = undefined
): number => {
  return Object.entries(weekObj).reduce((acc, [key, val]) => {
    if (
      typeof val === 'boolean' &&
      val === true &&
      (!excludePast ||
        (referenceDate && !isDayInPast(key as keyof Week, referenceDate)))
    ) {
      return acc + 1;
    }
    return acc;
  }, 0);
};
