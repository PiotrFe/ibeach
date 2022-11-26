export const cleanString = (str: string, removeAsterisks = true): string => {
  return removeAsterisks
    ? str
        .replaceAll(/\s{2,}/g, ' ')
        .replaceAll('*', '')
        .trim()
    : str.replaceAll(/\s{2,}/g, ' ').trim();
};
