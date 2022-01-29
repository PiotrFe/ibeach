export const getClosestPastMonday = (date: Date): Date => {
  const dateZeroed = date;
  dateZeroed.setHours(0, 0, 0, 0);
  const day = date.getDay();

  if (day === 1) {
    return dateZeroed;
  }

  let dayDiff;

  if (day === 0) {
    dayDiff = 6;
  } else {
    dayDiff = day - 1;
  }

  const currMs = dateZeroed.getTime();
  const msDiff = dayDiff * 24 * 60 * 60 * 1000;
  const monMs = currMs - msDiff;
  const monday = new Date(monMs);

  return monday;
};
