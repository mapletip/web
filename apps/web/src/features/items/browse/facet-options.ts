import type { FacetOption } from '@mapletip/component-library';

import type { ItemRow } from './project';

/**
 * Generic option derivation from observed values.
 *
 * An option that cannot narrow the page is dropped:
 * - If every row in the population has it, omit it.
 * - If no row matches, omit it.
 */
export function buildPresentFacetOptions<T extends string>(
  presentValues: Iterable<T>,
  scopedRows: readonly ItemRow[],
  matchesRow: (row: ItemRow, value: T) => boolean,
  labelOrMap: ((value: T) => string | undefined) | Readonly<Record<T, string>>,
  sortCompare?: (a: FacetOption, b: FacetOption) => number,
): readonly FacetOption[] {
  const populationTotal = scopedRows.length;
  if (populationTotal === 0) {
    return [];
  }

  const getLabel =
    typeof labelOrMap === 'function' ? labelOrMap : (val: T) => labelOrMap[val];

  const options: FacetOption[] = [];
  const distinctValues = Array.from(new Set(presentValues));

  for (const value of distinctValues) {
    const label = getLabel(value);
    if (!label) {
      continue;
    }

    let count = 0;
    for (const row of scopedRows) {
      if (matchesRow(row, value)) {
        count += 1;
      }
    }

    if (count > 0 && count < populationTotal) {
      options.push({ value, label });
    }
  }

  const sorter = sortCompare ?? ((a, b) => a.label.localeCompare(b.label));
  return options.sort(sorter);
}

/**
 * Derives pet target options with disambiguation:
 * - Options named from the target.
 * - When names collide, add the Pet's source ID from the roster.
 * - Unnamed gets "Unnamed pet (<source id>)".
 * - Unresolved source targets become "Unresolved target <target id>".
 * - Options that match all rows are omitted.
 */
export function buildPetFacetOptions(
  scopedRows: readonly ItemRow[],
  roster: readonly ItemRow[],
): readonly FacetOption[] {
  const populationTotal = scopedRows.length;
  if (populationTotal === 0) {
    return [];
  }

  const petByKey = new Map<string, ItemRow>();
  for (const row of roster) {
    if (row.itemClass === 'pet') {
      petByKey.set(row.key, row);
    }
  }

  const distinctTargetKeys = new Set<string>();
  const distinctUnresolved = new Set<string>();

  for (const row of scopedRows) {
    if (row.petTargets) {
      for (const target of row.petTargets) {
        distinctTargetKeys.add(target.key);
      }
    }
    if (row.unresolvedPetTargets) {
      for (const targetId of row.unresolvedPetTargets) {
        distinctUnresolved.add(targetId);
      }
    }
  }

  // Count occurrences of each name across distinct targets to detect collisions
  const nameCounts = new Map<string, number>();
  for (const key of distinctTargetKeys) {
    const pet = petByKey.get(key);
    let name = pet?.name;
    if (name === undefined) {
      for (const row of scopedRows) {
        const found = row.petTargets?.find((t) => t.key === key);
        if (found?.name) {
          name = found.name;
          break;
        }
      }
    }
    if (name) {
      nameCounts.set(name, (nameCounts.get(name) ?? 0) + 1);
    }
  }

  const options: FacetOption[] = [];

  for (const key of distinctTargetKeys) {
    const pet = petByKey.get(key);
    let name = pet?.name;
    if (name === undefined) {
      for (const row of scopedRows) {
        const found = row.petTargets?.find((t) => t.key === key);
        if (found?.name) {
          name = found.name;
          break;
        }
      }
    }
    const sourceId = pet?.sourceId;

    let label: string;
    if (!name) {
      label = sourceId ? `Unnamed pet (${sourceId})` : `Unnamed pet (${key})`;
    } else if ((nameCounts.get(name) ?? 0) > 1) {
      label = sourceId ? `${name} (${sourceId})` : `${name} (${key})`;
    } else {
      label = name;
    }

    let count = 0;
    for (const row of scopedRows) {
      if (row.petTargets?.some((t) => t.key === key)) {
        count += 1;
      }
    }

    if (count > 0 && count < populationTotal) {
      options.push({ value: key, label });
    }
  }

  for (const unresolvedId of distinctUnresolved) {
    let count = 0;
    for (const row of scopedRows) {
      if (row.unresolvedPetTargets?.includes(unresolvedId)) {
        count += 1;
      }
    }

    if (count > 0 && count < populationTotal) {
      options.push({
        value: unresolvedId,
        label: `Unresolved target ${unresolvedId}`,
      });
    }
  }

  return options.sort((a, b) => a.label.localeCompare(b.label));
}
