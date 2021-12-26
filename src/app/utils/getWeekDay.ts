export const getWeekDayDate = (
  day: number,
  dir?: 'prev' | 'next',
  refDate?: Date
): Date => {
  const baseDate = refDate || new Date();
  const baseDay: number = baseDate.getDay();
  const dayUnit: number = 1000 * 60 * 60 * 24;
  const unitCount =
    baseDay === 0 && dir === 'prev'
      ? 7 - day
      : baseDay === 6 && dir === 'next'
      ? 1 + day
      : day;

  let returnDate!: Date;

  if (dir === 'next') {
    returnDate = new Date(baseDate.getTime() + dayUnit * unitCount);
  } else {
    returnDate = new Date(baseDate.getTime() - dayUnit * unitCount);
  }

  returnDate.setHours(0, 0, 0, 0);

  return returnDate;
};
