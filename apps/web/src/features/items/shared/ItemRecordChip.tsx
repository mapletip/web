import { EntityChip } from '@mapletip/component-library';
import type { ReactElement } from 'react';

import type { ItemRecordChipView } from './itemRecordChipProjection';

/** Item-owned compact identity chip used in Monster relationships. */
export function ItemRecordChip({
  item,
  trailing,
}: {
  readonly item: ItemRecordChipView;
  readonly trailing?: ReactElement;
}): ReactElement {
  return (
    <EntityChip
      name={item.name}
      iconSrc={item.iconUrl}
      iconSize={28}
      trailing={trailing}
    />
  );
}
