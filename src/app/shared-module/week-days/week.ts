export interface Week {
  mon: boolean | { id: string; value: string };
  tue: boolean | { id: string; value: string };
  wed: boolean | { id: string; value: string };
  thu: boolean | { id: string; value: string };
  fri: boolean | { id: string; value: string };
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
