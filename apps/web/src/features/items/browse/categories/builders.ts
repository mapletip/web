import type { ItemBrowseFunction, ItemBrowseType } from '../project';

import type { ItemOtherChild, ItemPositiveChild } from './types';

export interface ByTypeOptions {
  readonly slug: string;
  readonly label: string;
  readonly type: ItemBrowseType;
  readonly iconContentIds?: readonly string[];
}

export interface ByFunctionOptions {
  readonly slug: string;
  readonly label: string;
  readonly fn: ItemBrowseFunction;
  readonly iconContentIds?: readonly string[];
}

export interface OtherChildOptions {
  readonly slug: string;
  readonly label: string;
  readonly iconContentIds?: readonly string[];
}

export const byType = ({
  slug,
  label,
  type,
  iconContentIds,
}: ByTypeOptions): ItemPositiveChild => ({
  kind: 'positive',
  slug,
  label,
  matches: (row) => row.types?.includes(type) ?? false,
  ...(iconContentIds ? { iconContentIds } : {}),
});

export const byFunction = ({
  slug,
  label,
  fn,
  iconContentIds,
}: ByFunctionOptions): ItemPositiveChild => ({
  kind: 'positive',
  slug,
  label,
  matches: (row) => row.functions?.includes(fn) ?? false,
  ...(iconContentIds ? { iconContentIds } : {}),
});

export const otherChild = ({
  slug,
  label,
  iconContentIds,
}: OtherChildOptions): ItemOtherChild => ({
  kind: 'other',
  slug,
  label,
  ...(iconContentIds ? { iconContentIds } : {}),
});
