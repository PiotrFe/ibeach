export const cleanString = (str: string): string => {
  return str
    .replaceAll(/\s{2,}/g, ' ')
    .replaceAll('*', '')
    .trim();
};
