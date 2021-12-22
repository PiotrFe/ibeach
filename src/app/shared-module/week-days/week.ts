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
