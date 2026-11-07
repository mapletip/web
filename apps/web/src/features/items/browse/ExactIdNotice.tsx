import { Alert, Anchor, List, Text } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import type { ReactElement } from 'react';

import type { BuildId } from '@/config/maplekit';

import { ITEM_NAV_TARGET } from './navigation';
import type { ExactIdNoticeState } from './search';

export interface ExactIdNoticeProps {
  readonly notice: ExactIdNoticeState;
  readonly buildId: BuildId;
}

export function ExactIdNotice({
  notice,
  buildId,
}: ExactIdNoticeProps): ReactElement {
  const buildParam = buildId === 'cw-launch' ? undefined : buildId;

  if (notice.kind === 'none') {
    return (
      <Alert variant="light">
        <Text size="sm">
          {notice.buildLabel} has no item with ID {notice.query}.
        </Text>
      </Alert>
    );
  }

  if (notice.kind === 'outside-category') {
    return (
      <Alert variant="light">
        <Text size="sm">
          {`Item ${notice.item.sourceId} is in `}
          <Anchor
            renderRoot={(props) => (
              <Link
                to={ITEM_NAV_TARGET}
                params={{
                  buildId: buildParam,
                  scope: notice.owningScope.slug,
                }}
                search={{ q: notice.query }}
                {...props}
              />
            )}
          >
            {notice.owningScope.label}
          </Anchor>
          .
        </Text>
      </Alert>
    );
  }

  return (
    <Alert variant="light" title={`Matching items for ID ${notice.query}`}>
      <List size="sm">
        {notice.items.map(({ item, owningScope }) => (
          <List.Item key={item.key}>
            {`${item.name ?? 'Unnamed item'} (${item.sourceId}) is in `}
            <Anchor
              renderRoot={(props) => (
                <Link
                  to={ITEM_NAV_TARGET}
                  params={{
                    buildId: buildParam,
                    scope: owningScope.slug,
                  }}
                  search={{ q: notice.query }}
                  {...props}
                />
              )}
            >
              {owningScope.label}
            </Anchor>
          </List.Item>
        ))}
      </List>
    </Alert>
  );
}
