export const removeExtraSpacesFromStr = (str: string): string => {
  return str.replace(/ +(?= )/g, '').trim();
};
