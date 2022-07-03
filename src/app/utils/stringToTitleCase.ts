export function stringToTitleCase(str: string): string {
  if (!str.length) {
    return '';
  }

  const arr = str.split(' ');
  const mapped = arr.map((substr) => {
    const first = substr.charAt(0).toUpperCase();
    const rest = substr.slice(1);

    return `${first}${rest}`;
  });

  return mapped.join(' ');
}
