export const getSkillGroupColor = (skill: string): string => {
  if (['EM', 'PSSM', 'PE', 'EDS'].includes(skill)) {
    return 'green';
  }
  if (['ASC', 'PSSA', 'SRAS', 'SPDS'].includes(skill)) {
    return 'yellow';
  }
  if (['BA', 'FELL', 'FDS', 'SFDS', 'PSSR'].includes(skill)) {
    return 'orange';
  }
  if (['INT', 'SA', 'ECAI'].includes(skill)) {
    return 'red';
  }
  return '';
};
