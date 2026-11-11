import { Stack, Text } from '@mantine/core';
import { useId } from 'react';
import type { ReactElement, ReactNode } from 'react';

import classes from './FacetContainer.module.css';
import labelClasses from './FacetLabel.module.css';

export interface FacetContainerProps {
  readonly label: ReactNode;
  readonly children: ReactNode | ((labelId: string) => ReactNode);
}

/** Shared accessible label and spacing wrapper for facet controls. */
export function FacetContainer({
  label,
  children,
}: FacetContainerProps): ReactElement {
  const labelId = useId();
  const content = typeof children === 'function' ? children(labelId) : children;

  return (
    <div className={classes['container']}>
      <Text
        id={labelId}
        className={labelClasses['label'] ?? ''}
        component="p"
        m={0}
      >
        {label}
      </Text>
      <Stack gap="xs">{content}</Stack>
    </div>
  );
}
