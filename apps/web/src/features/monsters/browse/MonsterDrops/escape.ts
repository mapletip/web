import type { KeyboardEvent } from 'react';

export function closeDropsPanelOnEscape(
  event: KeyboardEvent<HTMLElement>,
  onClose: (() => void) | undefined,
): void {
  if (
    event.key !== 'Escape' ||
    event.defaultPrevented ||
    onClose === undefined
  ) {
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  onClose();
}
