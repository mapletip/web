import type { RecordCardValuePart } from '@mapletip/component-library';

import { numberFormat } from './number-format';

/** HP and MP recovery as headline parts: flat amounts, then percentages, HP warm and MP cool. */
export function recoveryParts({
  hp,
  hpPercent,
  mp,
  mpPercent,
}: {
  readonly hp?: number | undefined;
  readonly hpPercent?: number | undefined;
  readonly mp?: number | undefined;
  readonly mpPercent?: number | undefined;
}): readonly RecordCardValuePart[] {
  const parts: RecordCardValuePart[] = [];
  if (hp !== undefined) {
    parts.push({
      id: 'hp',
      text: `+${numberFormat.format(hp)} HP`,
      tone: 'warm',
    });
  }
  if (hpPercent !== undefined) {
    parts.push({
      id: 'hp-percent',
      text: `+${numberFormat.format(hpPercent)}% HP`,
      tone: 'warm',
    });
  }
  if (mp !== undefined) {
    parts.push({
      id: 'mp',
      text: `+${numberFormat.format(mp)} MP`,
      tone: 'cool',
    });
  }
  if (mpPercent !== undefined) {
    parts.push({
      id: 'mp-percent',
      text: `+${numberFormat.format(mpPercent)}% MP`,
      tone: 'cool',
    });
  }
  return parts;
}
