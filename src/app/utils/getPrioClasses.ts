export const getPrioClasses = (
  prio: number | undefined,
  inEditMode = false
): string => {
  let prioNo = !inEditMode && !prio ? 'hidden' : prio;
  // let base = 'bi';
  let base = 'bi ml-5 mr-5';

  if (inEditMode) {
    base += ' clickable';
  }

  return !prio
    ? `${base} bi-star prio-${prioNo}`
    : `${base} bi-star-fill prio-${prioNo}`;
};
