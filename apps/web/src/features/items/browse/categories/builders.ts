import type { ItemBrowseFunction, ItemBrowseType } from '../project';

import type { ItemOtherChild, ItemPositiveChild } from './types';

export interface ByTypeOptions<TSlug extends string = string> {
  readonly slug: TSlug;
  readonly label: string;
  readonly type: ItemBrowseType;
  readonly iconContentIds?: readonly string[];
}

export interface ByFunctionOptions<TSlug extends string = string> {
  readonly slug: TSlug;
  readonly label: string;
  readonly fn: ItemBrowseFunction;
  readonly iconContentIds?: readonly string[];
}

export interface OtherChildOptions<TSlug extends string = string> {
  readonly slug: TSlug;
  readonly label: string;
  readonly iconContentIds?: readonly string[];
}

export function byType<const TSlug extends string>({
  slug,
  label,
  type,
  iconContentIds,
}: ByTypeOptions<TSlug>): ItemPositiveChild<TSlug> {
  return {
    kind: 'positive',
    slug,
    label,
    matches: (row) => row.types?.includes(type) ?? false,
    ...(iconContentIds ? { iconContentIds } : {}),
  };
}

export function byFunction<const TSlug extends string>({
  slug,
  label,
  fn,
  iconContentIds,
}: ByFunctionOptions<TSlug>): ItemPositiveChild<TSlug> {
  return {
    kind: 'positive',
    slug,
    label,
    matches: (row) => row.functions?.includes(fn) ?? false,
    ...(iconContentIds ? { iconContentIds } : {}),
  };
}

export function otherChild<const TSlug extends string>({
  slug,
  label,
  iconContentIds,
}: OtherChildOptions<TSlug>): ItemOtherChild<TSlug> {
  return {
    kind: 'other',
    slug,
    label,
    ...(iconContentIds ? { iconContentIds } : {}),
  };
}
