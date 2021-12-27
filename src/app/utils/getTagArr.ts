const tags = [
  { type: 'fun', value: 'DnA' },
  { type: 'fun', value: 'M&S' },
  { type: 'fun', value: 'ORG' },
  { type: 'ind', value: 'FIG' },
  { type: 'ind', value: 'TTL' },
  { type: 'ind', value: 'INS' },
  { type: 'ind', value: 'AI' },
  { type: 'ind', value: 'GEM' },
  { type: 'ind', value: 'PMP' },
  { type: 'ind', value: 'PSS' },
];

export const getTagArr = (): any[] => {
  return tags;
};

export const getTagFunction = (value: string): string => {
  const fun = tags.find((tag) => tag.value === value);

  return fun ? fun.type : '';
};
