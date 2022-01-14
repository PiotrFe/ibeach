export interface Week {
  mon: boolean | { id: string; text: string };
  tue: boolean | { id: string; text: string };
  wed: boolean | { id: string; text: string };
  thu: boolean | { id: string; text: string };
  fri: boolean | { id: string; text: string };
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
