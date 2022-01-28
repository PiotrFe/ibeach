export const removeExtraSpacesFromStr = (str: string): string => {
  const ret = str.replace(/ +(?= )/g, '').trim();

  console.log(ret);

  return ret;
};
