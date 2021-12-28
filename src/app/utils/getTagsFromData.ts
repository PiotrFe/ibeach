import { Tag } from '../people-list/person';

export const getTagsFromData = (
  data: string,
  tagType: 'ind' | 'fun'
): Tag[] => {
  const dataArrRaw = data.split('; ');
  const regex = /\(\d{1,3}%\)/i;
  const tagStrArr = dataArrRaw
    .filter((item) => {
      const percent = item.match(/\d{1,3}/);

      if (!percent) {
        return false;
      }
      const int = parseInt(percent[0]);

      return int >= 15;
    })
    .map((item) => item.toLowerCase().replace(regex, ''))
    .map((item) => {
      const tag = {
        value: getTagMatchForItem(item, tagType).toUpperCase(),
        type: tagType,
      };

      return JSON.stringify(tag);
    });

  const tagsSet = new Set(tagStrArr);
  const tagArr = Array.from(tagsSet)
    .map((str) => JSON.parse(str))
    .filter((tag) => tag.value !== '');

  return tagArr;
};

const getTagMatchForItem = (item: string, tagType: 'ind' | 'fun'): string => {
  const tagObj = tagType === 'ind' ? ind : ind;
  const tags = Object.keys(tagObj);

  for (let tag of tags) {
    const keywordArr = tagObj[tag as keyof typeof tagObj];

    for (let keyword of keywordArr) {
      console.log({
        tag,
        keywordArr,
        keyword,
        item,
        match: item.match(keyword),
      });
      if (item.match(keyword)) {
        return tag;
      }
    }
  }

  return '';
};

const ind = {
  ai: [
    'automotive',
    'semiconductor',
    'mechanical',
    'vehicle',
    'machinery',
    'industrial',
    'electrical',
    'construction',
    'building',
  ],
  bnk: ['banking', 'wealth', 'payments', 'consumer credit'],
  cig: [
    'tobacco',
    'food',
    'consumer',
    'grocery',
    'retail',
    'fashion',
    'beverages',
    'personal care',
  ],
  gem: [
    'epng',
    'energy',
    'oil & gas',
    'agriculture',
    'agricultural',
    'chemicals',
    'mining',
    'packaging',
    'polymers',
    'metals',
    'basic materials',
  ],
  ins: ['multi-line', 'casualty', 'insurance'],
  pe: ['private equity'],
  pmp: [
    'pharma',
    'desease',
    'drugs',
    'medication',
    'vaccines',
    'healthcare',
    'medtech',
    'medical',
    'animal',
    'vaccines',
    'generics',
  ],
  pss: [
    'government',
    'educational org',
    'nonprofit',
    'foundation',
    'ministry',
    'ministries',
    'donors',
  ],
  tech: ['technology', 'advanced electronics', 'software'],
  tmt: ['telecom', 'media'],
  ttl: ['transport', 'logistics', 'travel'],
};
