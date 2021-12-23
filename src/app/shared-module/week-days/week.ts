export interface Week {
  mon: boolean;
  tue: boolean;
  wed: boolean;
  thu: boolean;
  fri: boolean;
}

const newWeek: Week = {
  mon: true,
  tue: true,
  wed: true,
  thu: true,
  fri: true,
};

export const getNewWeek = (): Week => {
  return {
    ...newWeek,
  };
};

export const getDaysLeft = (weekObj: Week): number => {
  return Object.values(weekObj).reduce((acc, val) => (val ? acc + 1 : acc), 0);
};
