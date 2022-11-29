export type SkillColor = 'blue' | 'green' | 'yellow' | 'orange' | 'red' | '';

export const getSkillGroupColor = (skill: string): SkillColor => {
  if (['AP', 'EAP'].includes(skill)) {
    return 'blue';
  }
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
