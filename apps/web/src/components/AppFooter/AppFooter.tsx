import { Footer } from '@mapletip/component-library';
import type { FooterGroup } from '@mapletip/component-library';
import { ArrowSquareOut } from '@phosphor-icons/react';
import { Link } from '@tanstack/react-router';
import type { ReactElement } from 'react';

import classes from './AppFooter.module.css';

const groups = [
  {
    id: 'explore',
    title: 'Explore',
    links: [
      { id: 'monsters', label: 'Monsters', href: '/maplestory/monsters' },
      { id: 'maps', label: 'Maps', href: '/maplestory/maps' },
      { id: 'quests', label: 'Quests', href: '/maplestory/quests' },
      { id: 'npcs', label: 'NPCs', href: '/maplestory/npcs' },
      {
        id: 'music',
        label: 'MapleStory Music',
        href: '/maplestory/music',
      },
      { id: 'forums', label: 'Forums', href: 'https://forums.mapletip.com' },
    ],
  },
  {
    id: 'items',
    title: 'Items',
    links: [
      { id: 'equipment', label: 'Equipment', href: '/maplestory/equipment' },
      { id: 'all-items', label: 'All Items', href: '/maplestory/items' },
      { id: 'use-items', label: 'Use Items', href: '/maplestory/items/use' },
      { id: 'etc-items', label: 'ETC Items', href: '/maplestory/items/etc' },
      {
        id: 'setup-items',
        label: 'Set-up Items',
        href: '/maplestory/items/setup',
      },
      {
        id: 'cash-items',
        label: 'Cash Items & Pets',
        href: '/maplestory/items/cash',
      },
    ],
  },
  {
    id: 'about',
    title: 'About',
    links: [{ id: 'privacy', label: 'Privacy Policy', href: '/privacy' }],
  },
] satisfies readonly FooterGroup[];

const officialMapleStoryUrl = 'https://www.nexon.com/maplestory/';
const officialNexonUrl = 'https://www.nexon.com/main/en';

/**
 * The two official attribution links share an intentional new-tab decision and
 * its disclosure. Everything else in the legal copy is plain text.
 */
function OfficialLink({
  href,
  children,
}: {
  readonly href: string;
  readonly children: string;
}): ReactElement {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${children} (opens in a new tab)`}
    >
      {children}
      <ArrowSquareOut
        className={classes['externalIcon']}
        size={12}
        aria-hidden="true"
        focusable="false"
      />
    </a>
  );
}

const legal = (
  <p>
    MapleTip is a free, unofficial{' '}
    <OfficialLink href={officialMapleStoryUrl}>MapleStory</OfficialLink> fan
    resource and is not affiliated with, endorsed by, or sponsored by{' '}
    <span className={classes['nowrap']}>
      <OfficialLink href={officialNexonUrl}>NEXON</OfficialLink>.
    </span>{' '}
    MapleStory and related game content are property of NEXON and/or their
    respective rights holders.
  </p>
);

export function AppFooter() {
  return (
    <Footer
      brand={
        <Link className={classes['brand']} to="/">
          <img
            className={classes['mark']}
            src="/brand/mapletip-mark.svg"
            alt=""
            width={24}
            height={24}
          />
          <span className={classes['wordmark']}>
            Maple<span className={classes['tip']}>Tip</span>
          </span>
        </Link>
      }
      description="Your destination for MapleStory guides and help."
      groups={groups}
      legal={legal}
    />
  );
}
