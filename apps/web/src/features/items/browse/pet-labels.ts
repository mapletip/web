import type { ItemRow } from './project';

/**
 * Builds a key -> label lookup for pet targets from the roster.
 *
 * Rules:
 * - Unnamed pet gets "Unnamed pet (<source id>)".
 * - When names collide across distinct pets, disambiguates with source ID: "<name> (<source id>)".
 * - Unique names get "<name>".
 */
export function buildPetLabels(
  roster: readonly ItemRow[],
): ReadonlyMap<string, string> {
  const pets = new Map<
    string,
    { readonly name?: string | undefined; readonly sourceId: string }
  >();
  for (const row of roster) {
    if (row.itemClass === 'pet') {
      pets.set(row.key, { name: row.name, sourceId: row.sourceId });
    }
  }

  const nameCounts = new Map<string, number>();
  for (const pet of pets.values()) {
    if (pet.name) {
      nameCounts.set(pet.name, (nameCounts.get(pet.name) ?? 0) + 1);
    }
  }

  const labels = new Map<string, string>();
  for (const [key, pet] of pets) {
    if (!pet.name) {
      labels.set(key, `Unnamed pet (${pet.sourceId})`);
    } else if ((nameCounts.get(pet.name) ?? 0) > 1) {
      labels.set(key, `${pet.name} (${pet.sourceId})`);
    } else {
      labels.set(key, pet.name);
    }
  }

  return labels;
}
