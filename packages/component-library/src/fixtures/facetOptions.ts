import {
  demoCategoryValues,
  demoRecords,
  demoRegionValues,
  demoStatusValues,
} from '@/fixtures/records';

export const demoGroupFacetOptions = [
  ...demoCategoryValues.map((value) => ({
    value,
    label: value,
    count: demoRecords.filter((record) => record.group === value).length,
  })),
  {
    value: 'Category with no matches',
    label: 'No matching category',
    count: 0,
  },
];

export const demoRegionFacetOptions = demoRegionValues.map((value) => ({
  value,
  label: value,
  count: demoRecords.filter((record) => record.region === value).length,
}));

export const demoStatusFacetOptions = demoStatusValues.map((value) => ({
  value,
  label: value,
  count: demoRecords.filter((record) => record.status === value).length,
}));
