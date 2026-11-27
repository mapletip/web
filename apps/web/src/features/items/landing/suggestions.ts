import type { AutocompleteProps } from '@mantine/core';

/** Rank matching names before the action, with prefixes first. */
export const matchItemSuggestions: NonNullable<AutocompleteProps['filter']> = ({
  options,
  search,
  limit,
}) => {
  const needle = search.trim().toLocaleLowerCase('en');
  if (needle === '') return [];
  const matches = options.filter(
    (option) =>
      'value' in option &&
      option.value !== '__see_all_results__' &&
      option.label.toLocaleLowerCase('en').includes(needle),
  );
  matches.sort((left, right) => {
    if (!('label' in left) || !('label' in right)) return 0;
    const leftPrefix = left.label.toLocaleLowerCase('en').startsWith(needle);
    const rightPrefix = right.label.toLocaleLowerCase('en').startsWith(needle);
    if (leftPrefix !== rightPrefix) return leftPrefix ? -1 : 1;
    return left.label.localeCompare(right.label, 'en');
  });
  const seeAll =
    matches.length === 0
      ? undefined
      : options.find(
          (option) =>
            'value' in option && option.value === '__see_all_results__',
        );
  return [
    ...matches.slice(0, limit),
    ...(seeAll === undefined ? [] : [seeAll]),
  ];
};

export const MAX_ITEM_SUGGESTIONS = 6;
