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

export const getDaysLeft = (weekObj: Week): number => {
  return Object.values(weekObj).reduce((acc, val) => {
    if (typeof val === 'boolean' && val === true) {
      return acc + 1;
    }
    return acc;
  }, 0);
};
