import type { FacetDefinition } from '@mapletip/component-library';
import type { ItemBrowseCoverage } from '@mapletip/data/items';

import { buildPresentFacetOptions } from './facet-options';
import {
  SCROLL_STAT_LABELS,
  UPGRADE_SPECIAL_LABELS,
  UPGRADE_TARGET_LABELS,
  UPGRADE_TIER_LABELS,
} from './labels';
import type {
  ItemBrowseUpgradeSpecial,
  ItemBrowseUpgradeTarget,
  ItemBrowseUpgradeTier,
  ItemRow,
} from './project';

export function buildUpgradeScrollFacets(
  scopedRows: readonly ItemRow[],
  coverage: ItemBrowseCoverage,
): readonly FacetDefinition<ItemRow>[] {
  const facets: FacetDefinition<ItemRow>[] = [];

  // 1. scrollTarget (Equipment type)
  const presentTargets = new Set<ItemBrowseUpgradeTarget>();
  for (const row of scopedRows) {
    if (row.targetLabel) {
      presentTargets.add(row.targetLabel);
    }
  }
  const targetOptions = buildPresentFacetOptions(
    presentTargets,
    scopedRows,
    (row, target) => row.targetLabel === target,
    UPGRADE_TARGET_LABELS,
  );
  if (targetOptions.length > 0) {
    facets.push({
      id: 'scrollTarget',
      field: 'scrollTarget',
      label: 'Equipment type',
      kind: 'multi-select',
      quick: true,
      options: targetOptions,
    });
  }

  // 2. scrollStat (keys of stats, OR within)
  const presentStats = new Set<string>();
  for (const row of scopedRows) {
    if (row.stats) {
      for (const stat of Object.keys(row.stats)) {
        presentStats.add(stat);
      }
    }
  }
  const statOptions = buildPresentFacetOptions(
    presentStats,
    scopedRows,
    (row, stat) => row.stats !== undefined && stat in row.stats,
    SCROLL_STAT_LABELS,
  );
  if (statOptions.length > 0) {
    facets.push({
      id: 'scrollStat',
      field: 'scrollStat',
      label: 'Stat',
      kind: 'multi-select',
      quick: true,
      options: statOptions,
    });
  }

  // 3. scrollSuccess (exact present values sorted numerically)
  const presentSuccess = new Set<string>();
  for (const row of scopedRows) {
    if (row.success !== undefined) {
      presentSuccess.add(String(row.success));
    }
  }
  const successOptions = buildPresentFacetOptions(
    presentSuccess,
    scopedRows,
    (row, s) => row.success !== undefined && String(row.success) === s,
    (val) => `${val}%`,
    (a, b) => Number(a.value) - Number(b.value),
  );
  if (successOptions.length > 0) {
    facets.push({
      id: 'scrollSuccess',
      field: 'scrollSuccess',
      label: 'Success rate',
      kind: 'multi-select',
      options: successOptions,
    });
  }

  // 4. scrollRisk (Destruction risk: none + cursed rates)
  const presentRisk = new Set<string>();
  for (const row of scopedRows) {
    if (typeof row.cursed === 'number' && row.cursed > 0) {
      presentRisk.add(String(row.cursed));
    } else {
      presentRisk.add('none');
    }
  }
  const riskLabels: Record<string, string> = {
    none: 'No recorded risk',
  };
  for (const r of presentRisk) {
    if (r !== 'none') {
      riskLabels[r] = `${r}% on failure`;
    }
  }
  const riskOptions = buildPresentFacetOptions(
    presentRisk,
    scopedRows,
    (row, risk) => {
      if (risk === 'none') {
        return row.cursed === undefined || row.cursed === 0;
      }
      return typeof row.cursed === 'number' && String(row.cursed) === risk;
    },
    riskLabels,
    (a, b) => {
      if (a.value === 'none') return -1;
      if (b.value === 'none') return 1;
      return Number(a.value) - Number(b.value);
    },
  );
  if (riskOptions.length > 0) {
    facets.push({
      id: 'scrollRisk',
      field: 'scrollRisk',
      label: 'Destruction risk',
      kind: 'multi-select',
      options: riskOptions,
    });
  }

  // 5. scrollTier (only when coverage.scrollTier is not unsupported and values exist)
  if (coverage.scrollTier !== 'unsupported') {
    const presentTiers = new Set<ItemBrowseUpgradeTier>();
    for (const row of scopedRows) {
      if (row.tier) {
        presentTiers.add(row.tier);
      }
    }
    const tierOptions = buildPresentFacetOptions(
      presentTiers,
      scopedRows,
      (row, tier) => row.tier === tier,
      UPGRADE_TIER_LABELS,
    );
    if (tierOptions.length > 0) {
      facets.push({
        id: 'scrollTier',
        field: 'scrollTier',
        label: 'Tier',
        kind: 'multi-select',
        options: tierOptions,
      });
    }
  }

  // 6. scrollSpecial (when present)
  const presentSpecials = new Set<ItemBrowseUpgradeSpecial>();
  for (const row of scopedRows) {
    if (row.specials) {
      for (const sp of row.specials) {
        presentSpecials.add(sp);
      }
    }
  }
  const specialOptions = buildPresentFacetOptions(
    presentSpecials,
    scopedRows,
    (row, sp) => row.specials?.includes(sp) ?? false,
    UPGRADE_SPECIAL_LABELS,
  );
  if (specialOptions.length > 0) {
    facets.push({
      id: 'scrollSpecial',
      field: 'scrollSpecial',
      label: 'Special',
      kind: 'multi-select',
      options: specialOptions,
    });
  }

  // 7. scrollDirect (single option "Verified equipment targets" when directTargetCount > 0)
  let directCount = 0;
  for (const row of scopedRows) {
    if (
      typeof row.directTargetCount === 'number' &&
      row.directTargetCount > 0
    ) {
      directCount += 1;
    }
  }
  if (directCount > 0 && directCount < scopedRows.length) {
    facets.push({
      id: 'scrollDirect',
      field: 'scrollDirect',
      label: 'Equipment targets',
      kind: 'multi-select',
      options: [{ value: 'verified', label: 'Verified equipment targets' }],
    });
  }

  return facets;
}
