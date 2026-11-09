import { describe, expect, it } from 'vitest';

import type {
  FacetDefinition,
  QueryFieldDefinition,
} from '@/components/FacetedBrowser';
import { resolveFacets } from '@/components/FacetedBrowser/FacetControls/resolveFacets';
import { resolveFields } from '@/components/FacetedBrowser/hooks/querySemantics';

interface FacetRecord extends Record<string, unknown> {
  readonly id: string;
  readonly exact: number;
  readonly large: number;
  readonly percent: number;
  readonly prefixed: number;
  readonly single: number;
  readonly tags: readonly string[];
  readonly dynamicTags: readonly string[];
  readonly numericTags: readonly string[];
  readonly flag: boolean | undefined;
  readonly constantFlag: boolean;
}

const records: readonly FacetRecord[] = [
  {
    id: 'a',
    exact: 10,
    large: 1,
    percent: 10,
    prefixed: 10,
    single: 3,
    tags: ['fire', 'always'],
    dynamicTags: ['fire', 'always'],
    numericTags: ['9'],
    flag: true,
    constantFlag: false,
  },
  {
    id: 'b',
    exact: 20,
    large: 2,
    percent: 20,
    prefixed: 20,
    single: 3,
    tags: ['water', 'always'],
    dynamicTags: ['water', 'always'],
    numericTags: ['10'],
    flag: false,
    constantFlag: false,
  },
  {
    id: 'c',
    exact: 30,
    large: 3,
    percent: 30,
    prefixed: 30,
    single: 3,
    tags: ['fire', 'always'],
    dynamicTags: ['fire', 'always'],
    numericTags: ['2'],
    flag: true,
    constantFlag: false,
  },
  {
    id: 'd',
    exact: 40,
    large: 4,
    percent: 40,
    prefixed: 40,
    single: 3,
    tags: ['water', 'always'],
    dynamicTags: ['water', 'always'],
    numericTags: [],
    flag: undefined,
    constantFlag: false,
  },
  {
    id: 'e',
    exact: 50,
    large: 5,
    percent: 50,
    prefixed: 50,
    single: 3,
    tags: ['fire', 'always'],
    dynamicTags: ['fire', 'always'],
    numericTags: [],
    flag: false,
    constantFlag: false,
  },
  {
    id: 'f',
    exact: 60,
    large: 6,
    percent: 60,
    prefixed: 60,
    single: 3,
    tags: ['water', 'always'],
    dynamicTags: ['water', 'always'],
    numericTags: [],
    flag: true,
    constantFlag: false,
  },
  {
    id: 'g',
    exact: 60,
    large: 7,
    percent: 60,
    prefixed: 60,
    single: 3,
    tags: ['water', 'always'],
    dynamicTags: ['water', 'always'],
    numericTags: [],
    flag: false,
    constantFlag: false,
  },
];

const queryFields: readonly QueryFieldDefinition<FacetRecord>[] = [
  { id: 'exact', accessor: 'exact' },
  { id: 'large', accessor: 'large' },
  { id: 'percent', accessor: 'percent' },
  { id: 'prefixed', accessor: 'prefixed' },
  { id: 'single', accessor: 'single' },
  { id: 'tags', accessor: 'tags' },
  { id: 'dynamicTags', accessor: 'dynamicTags' },
  { id: 'numericTags', accessor: 'numericTags' },
  { id: 'flag', accessor: 'flag' },
  { id: 'constantFlag', accessor: 'constantFlag' },
];

const facets: readonly FacetDefinition<FacetRecord>[] = [
  {
    id: 'exact',
    field: 'exact',
    label: 'Exact',
    kind: 'range',
    buckets: 'quantile',
  },
  {
    id: 'large',
    field: 'large',
    label: 'Large',
    kind: 'range',
    buckets: 'quantile',
  },
  {
    id: 'percent',
    field: 'percent',
    label: 'Percent',
    kind: 'range',
    buckets: 'quantile',
    unit: '%',
  },
  {
    id: 'prefixed',
    field: 'prefixed',
    label: 'Prefixed',
    kind: 'range',
    buckets: 'quantile',
    valuePrefix: '+',
  },
  { id: 'single', field: 'single', label: 'Single', kind: 'range' },
  {
    id: 'tags',
    field: 'tags',
    label: 'Tags',
    kind: 'multi-select',
    options: [
      { value: 'fire', label: 'Fire' },
      { value: 'water', label: 'Water' },
      { value: 'always', label: 'Always' },
      { value: 'missing', label: 'Missing' },
    ],
  },
  {
    id: 'dynamic',
    field: 'dynamicTags',
    label: 'Dynamic',
    kind: 'multi-select',
  },
  {
    id: 'numeric',
    field: 'numericTags',
    label: 'Numeric',
    kind: 'multi-select',
    formatOption: ({ value }) => `${value}%`,
  },
  { id: 'flag', field: 'flag', label: 'Flag', kind: 'boolean' },
  {
    id: 'constantFlag',
    field: 'constantFlag',
    label: 'Constant',
    kind: 'boolean',
  },
];

describe('resolveFacets', () => {
  it('uses exact buckets through six distinct values and quantiles above six', () => {
    const fieldAccessors = resolveFields({
      columns: [],
      queryFields,
      idAccessor: 'id',
      identityField: undefined,
      searchFields: undefined,
    });
    const resolved = resolveFacets({
      facets,
      queryFields,
      records,
      fieldAccessors,
    });

    const exact = resolved.facets.find((facet) => facet.id === 'exact');
    expect(exact?.kind === 'range' && exact.buckets).toEqual([
      { value: '10', label: '10', min: 10, max: 10 },
      { value: '20', label: '20', min: 20, max: 20 },
      { value: '30', label: '30', min: 30, max: 30 },
      { value: '40', label: '40', min: 40, max: 40 },
      { value: '50', label: '50', min: 50, max: 50 },
      { value: '60', label: '60', min: 60, max: 60 },
    ]);

    const large = resolved.facets.find((facet) => facet.id === 'large');
    if (
      large?.kind !== 'range' ||
      large.buckets === undefined ||
      typeof large.buckets === 'string'
    ) {
      throw new Error('Large quantiles were not resolved.');
    }
    expect(large.buckets.length).toBeLessThan(7);
    expect(large.buckets[0]?.value).not.toBe('1');

    const percent = resolved.facets.find((facet) => facet.id === 'percent');
    if (
      percent?.kind !== 'range' ||
      percent.buckets === undefined ||
      typeof percent.buckets === 'string'
    ) {
      throw new Error('Percent quantiles were not resolved.');
    }
    expect(percent.buckets.map((bucket) => bucket.label)).toEqual([
      '10%',
      '20%',
      '30%',
      '40%',
      '50%',
      '60%',
    ]);

    const prefixed = resolved.facets.find((facet) => facet.id === 'prefixed');
    expect(
      prefixed?.kind === 'range' &&
        prefixed.buckets !== undefined &&
        typeof prefixed.buckets !== 'string'
        ? prefixed.buckets.map((bucket) => bucket.label)
        : [],
    ).toEqual(['+10', '+20', '+30', '+40', '+50', '+60']);
  });

  it('prunes options and facets from the complete record set', () => {
    const fieldAccessors = resolveFields({
      columns: [],
      queryFields,
      idAccessor: 'id',
      identityField: undefined,
      searchFields: undefined,
    });
    const resolved = resolveFacets({
      facets,
      queryFields,
      records,
      fieldAccessors,
    });

    const declared = resolved.facets.find((facet) => facet.id === 'tags');
    expect(declared?.options).toEqual([
      { value: 'fire', label: 'Fire' },
      { value: 'water', label: 'Water' },
    ]);

    const dynamic = resolved.facets.find((facet) => facet.id === 'dynamic');
    expect(dynamic?.options).toEqual([
      { value: 'fire', label: 'fire' },
      { value: 'water', label: 'water' },
    ]);

    const numeric = resolved.facets.find((facet) => facet.id === 'numeric');
    expect(numeric?.options).toEqual([
      { value: '2', label: '2%' },
      { value: '9', label: '9%' },
      { value: '10', label: '10%' },
    ]);

    expect(resolved.facets.some((facet) => facet.id === 'single')).toBe(false);
    expect(resolved.facets.some((facet) => facet.id === 'constantFlag')).toBe(
      false,
    );
    expect(resolved.facets.some((facet) => facet.id === 'flag')).toBe(true);
  });
});
