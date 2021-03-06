import { Tag } from 'src/app/shared-module/entry/entry.component';

export const sortTags = (tags: Tag[]): Tag[] => {
  const indTags = tags.filter((tag) => tag.type === 'ind');
  const funTags = tags.filter((tag) => tag.type === 'fun');
  const othTags = tags.filter((tag) => tag.type === 'oth');

  indTags.sort(sortByVal);
  funTags.sort(sortByVal);
  othTags.sort(sortByVal);

  return [...indTags, ...funTags, ...othTags];
};

const sortByVal = (a: Tag, b: Tag): number => {
  const aVal = a.value.toUpperCase();
  const bVal = b.value.toUpperCase();

  if (aVal < bVal) {
    return -1;
  }
  if (aVal > bVal) {
    return 1;
  }

  return 0;
};
