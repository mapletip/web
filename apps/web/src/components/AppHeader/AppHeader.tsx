import { Header } from '@mapletip/component-library';
import type { HeaderLink } from '@mapletip/component-library';
import { Link } from '@tanstack/react-router';

import classes from './AppHeader.module.css';

const navigation: readonly HeaderLink[] = [
  {
    id: 'monsters',
    label: 'Monsters',
    href: '/maplestory/monsters',
  },
  {
    id: 'equipment',
    label: 'Equipment',
    children: [
      {
        id: 'all-equipment',
        label: 'All Equipment',
        href: '/maplestory/equipment',
      },
      {
        id: 'armor-accessories',
        label: 'Armor & accessories',
        href: '/maplestory/equipment?scope=armor-accessories',
      },
      {
        id: 'weapons',
        label: 'Weapons',
        href: '/maplestory/equipment?scope=weapons',
      },
      {
        id: 'other-equipment',
        label: 'Other equipment',
        href: '/maplestory/equipment?scope=other',
      },
    ],
  },
  {
    id: 'items',
    label: 'Items',
    children: [
      {
        id: 'all-items',
        label: 'All Items',
        href: '/maplestory/items',
      },
      {
        id: 'use-items',
        label: 'Use',
        href: '/maplestory/items/use',
      },
      {
        id: 'etc-items',
        label: 'ETC',
        href: '/maplestory/items/etc',
      },
      {
        id: 'setup-items',
        label: 'Set-up',
        href: '/maplestory/items/setup',
      },
      {
        id: 'cash-items',
        label: 'Cash/Pet',
        href: '/maplestory/items/cash',
      },
    ],
  },
  {
    id: 'maps',
    label: 'Maps',
    href: '/maplestory/maps',
  },
  {
    id: 'quests',
    label: 'Quests',
    href: '/maplestory/quests',
  },
  {
    id: 'npcs',
    label: 'NPCs',
    href: '/maplestory/npcs',
  },
];

export function AppHeader() {
  return (
    <Header
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
      navigation={navigation}
      navigationLabel="Global navigation"
    />
  );
}
