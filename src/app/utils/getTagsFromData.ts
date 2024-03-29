import { Tag } from 'src/app/shared-module/entry/entry.component';
import { cleanString } from 'src/app/utils';

export const getTagsFromData = (
  data: string,
  tagType: 'ind' | 'fun'
): Tag[] => {
  if (!data || data === '' || data?.length < 5) {
    return [];
  }
  const dataArrRaw = data.split('; ');
  const regex = /\(\d{1,3}%\)/i;
  const regexPercent = /\d{1,3}/;
  const tagMap = dataArrRaw
    .filter((item) => {
      const percent = item.match(regexPercent);

      if (!percent) {
        return false;
      }
      const int = parseInt(percent[0]);

      return int >= 10;
    })
    // .map((item) => item.toLowerCase().replace(regex, '').trim())
    .map((item) => {
      const percent = item.match(regexPercent);
      const itemVal = item.toLowerCase().replace(regex, '').trim();
      const percentVal = percent === null ? 0 : parseInt(percent[0]);

      const tag = {
        value:
          tagType === 'ind'
            ? getTagMatchForIndunstryItem(itemVal).toUpperCase()
            : getTagMatchForFunctionItem(itemVal).toUpperCase(),
        type: tagType,
        percent: percentVal,
      };

      return tag;
    })
    .filter((item) => item.value !== '')
    .reduce((tagMap: any, tagItem, idx, arr) => {
      if (tagMap[tagItem.value]) {
        const currentPercent = tagMap[tagItem.value].percent;
        return {
          ...tagMap,
          [tagItem.value]: {
            ...tagMap[tagItem.value],
            percent: currentPercent + tagItem.percent,
          },
        };
      }

      return {
        ...tagMap,
        [tagItem.value]: {
          type: tagItem.type,
          percent: tagItem.percent,
        },
      };
    }, {});

  const tagArr: Tag[] = Object.entries(tagMap).map<any>(([key, rest]) => {
    return {
      value: key,
      ...(rest as Object),
    };
  });
  return tagArr;
};

const getTagMatchForIndunstryItem = (item: string): string => {
  const tags = Object.keys(ind);

  for (let tag of tags) {
    const keywordArr = ind[tag as keyof typeof ind];

    for (let keyword of keywordArr) {
      if (
        item.match(keyword) &&
        !(keyword === 'culture' && item === 'agriculture')
      ) {
        return tag;
      }
    }
  }

  return '';
};

const getTagMatchForFunctionItem = (item: string): string => {
  const tags = Object.keys(fun);

  for (let tag of tags) {
    const keywordArr = fun[tag as keyof typeof fun];

    for (let keyword of keywordArr) {
      if (
        item.match(keyword) &&
        !(keyword === 'culture' && item === 'agriculture')
      ) {
        return tag;
      }
    }
  }

  return '';
};

export const getAffiliations = (
  affiliation: string,
  type: 'ind' | 'fun'
): Tag[] => {
  if (!affiliation) {
    return [];
  }

  const affiliationArray = affiliation
    .split(';')
    .map((str) => cleanString(str));
  const affiliationSet = new Set();

  for (let affiliationString of affiliationArray) {
    const tag =
      type === 'ind'
        ? getTagMatchForIndunstryItem(affiliationString.toLowerCase())
        : getTagMatchForFunctionItem(affiliationString.toLowerCase());

    if (tag) {
      affiliationSet.add(tag);
    }
  }

  return !affiliationSet.size
    ? []
    : ([...affiliationSet].map((tagName: any) => ({
        value: tagName.toUpperCase(),
        type,
        percent: 100,
      })) as Tag[]);
};

export const consolidateTags = (tags: Tag[], type: 'ind' | 'fun'): Tag[] => {
  if (!tags.length) {
    return [];
  }

  const tagMap: { [key: string]: number } = {};

  for (let tag of tags) {
    if (tagMap[tag.value]) {
      tagMap[tag.value] += tag.percent || 0;
    } else {
      tagMap[tag.value] = tag.percent || 0;
    }
  }
  return Object.entries(tagMap).map(([tag, percent]) => ({
    value: tag,
    percent,
    type,
  }));
};

export const getAvailableTags = (): Tag[] => {
  const indTags: Tag[] = [...Object.keys(ind)].map((indName) => ({
    type: 'ind',
    value: indName.toUpperCase(),
  }));

  const funTags = [...Object.keys(fun)].map((funName) => ({
    type: 'fun',
    value: funName.toUpperCase(),
  }));

  return [...indTags, ...funTags];
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
  pe: ['equity'],
  ls: [
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
    'life sciences',
  ],
  pss: [
    'government',
    'educational',
    'nonprofit',
    'foundation',
    'ministry',
    'ministries',
    'donors',
  ],
  tech: ['technology', 'electronics', 'software'],
  tmt: ['telecom', 'media'],
  ttl: ['transport', 'logistics', 'travel'],
};

const fun = {
  dna: [
    'cloud',
    'technology',
    'agile',
    'digital',
    'pricing',
    'data transformation',
  ],
  fin: ['finance', 'balance sheet'],
  'm&a': ['m&a'],
  'm&s': ['sales', 'channel', 'marketing'],
  ops: ['procurement', 'manufacturing', 'product development'],
  org: [
    'organization',
    'org performance',
    'service operations',
    'culture',
    'transformational change',
    'leadership',
    'talent',
  ],
  ris: ['risk'],
  str: [
    'capital excellence',
    'corporate strategy',
    'business strategy',
    'growth transformation',
    'growth strategy',
    'board strategy',
    'future of work',
    's&cf',
  ],
  inn: ['innovation'],
  reg: ['regulatory'],
  sus: ['sustainability', 'climate'],
};
