import {
  DrillDownNav,
  type DrillDownNode,
  type FacetedBrowserNavigationRenderContext,
} from '@mapletip/component-library';
import { useState, type ReactElement } from 'react';

import type { BuildId } from '@/config/maplekit';
import type { BrowseSearch } from '@/features/browse/search-params';
import type { MapLocationParams } from '@/features/maps/shared';

import { OTHER_COLLECTIONS_ID } from './location';
import { LocationLink } from './LocationLink';

interface MapLocationNavigationProps {
  readonly root: DrillDownNode<MapLocationParams>;
  readonly currentId: string;
  readonly context: FacetedBrowserNavigationRenderContext;
  readonly buildId: BuildId;
  readonly search: BrowseSearch;
}

/** The collection group is a navigation step shared by the rail and drawer. */
export function MapLocationNavigation({
  root,
  currentId,
  context,
  buildId,
  search,
}: MapLocationNavigationProps): ReactElement {
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const selectedId = context.mode === 'drawer' ? context.selectedId : currentId;
  const visibleId = collectionsOpen ? OTHER_COLLECTIONS_ID : selectedId;

  if (context.mode === 'drawer') {
    return (
      <DrillDownNav
        root={root}
        currentId={visibleId}
        label="Locations"
        onSelect={(node, meta) => {
          if (node.id === OTHER_COLLECTIONS_ID) {
            setCollectionsOpen(true);
            return;
          }
          setCollectionsOpen(false);
          if (collectionsOpen && node.id === selectedId) return;
          context.onSelect(node, meta);
        }}
      />
    );
  }

  return (
    <DrillDownNav
      root={root}
      currentId={visibleId}
      label="Locations"
      onNavigate={() => {
        setCollectionsOpen(false);
        context.onNavigate?.();
      }}
      renderLink={(node, props) =>
        node.id === OTHER_COLLECTIONS_ID ? (
          <button
            type="button"
            className={props.className}
            aria-expanded={collectionsOpen}
            onClick={() => setCollectionsOpen((opened) => !opened)}
          >
            {props.children}
          </button>
        ) : (
          <LocationLink
            buildId={buildId}
            params={node.meta ?? {}}
            search={search}
            props={props}
          />
        )
      }
    />
  );
}
