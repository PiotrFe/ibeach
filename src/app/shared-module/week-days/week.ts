export interface Week {
  mon: boolean;
  tue: boolean;
  wed: boolean;
  thu: boolean;
  fri: boolean;
}

export interface WeekAllocated {
  mon: boolean | string;
  tue: boolean | string;
  wed: boolean | string;
  thu: boolean | string;
  fri: boolean | string;
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
  return Object.values(weekObj).reduce((acc, val) => (val ? acc + 1 : acc), 0);
};
