import { Anchor, Stack, Text, Title } from '@mantine/core';
import type { ReactElement } from 'react';

import { DetailPageShell } from '@/components/DetailPageShell';
import { AnchorLink } from '@/components/RouterLinks';

import type { DetailLinkProps } from './DetailBreadcrumbs';

const DEFAULT_NOT_FOUND_MESSAGE =
  "We couldn't find the record you're looking for.";

export interface RecordNotFoundProps {
  readonly title: string;
  readonly message?: string;
  readonly backLabel: string;
  readonly backPath: string;
  readonly backLinkProps?: DetailLinkProps;
}

/** Friendly 404 view for missing or malformed record detail addresses. */
export function RecordNotFound({
  title,
  message = DEFAULT_NOT_FOUND_MESSAGE,
  backLabel,
  backPath,
  backLinkProps,
}: RecordNotFoundProps): ReactElement {
  return (
    <DetailPageShell>
      <Stack gap="sm" py="xl">
        <Title order={1}>{title}</Title>
        <Text c="dimmed">{message}</Text>
        <div>
          {backLinkProps ? (
            <AnchorLink {...backLinkProps}>{backLabel}</AnchorLink>
          ) : (
            <Anchor href={backPath}>{backLabel}</Anchor>
          )}
        </div>
      </Stack>
    </DetailPageShell>
  );
}
