export const getPrioClasses = (prio: number | undefined): string => {
  const base = 'bi ml-5 mr-5';

  return !prio ? `${base} bi-star` : `${base} bi-star-fill prio-${prio}`;
};
