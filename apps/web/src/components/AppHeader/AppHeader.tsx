import { Header } from '@mapletip/component-library';
import type { HeaderLink } from '@mapletip/component-library';
import {
  Backpack,
  Package,
  Shield,
  SquaresFour,
  Sword,
} from '@phosphor-icons/react';
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
    description: 'Browse equipment types',
    children: [
      {
        id: 'all-equipment',
        label: 'All Equipment',
        description: 'Browse every equipment type',
        icon: <SquaresFour />,
        href: '/maplestory/equipment',
      },
      {
        id: 'armor-accessories',
        label: 'Armor & accessories',
        description: 'Hats, clothing, accessories',
        icon: <Shield />,
        href: '/maplestory/equipment?scope=armor-accessories',
      },
      {
        id: 'weapons',
        label: 'Weapons',
        description: 'Explore weapons by family',
        icon: <Sword />,
        href: '/maplestory/equipment?scope=weapons',
      },
      {
        id: 'other-equipment',
        label: 'Other equipment',
        description: 'Mounts and additional equipment',
        icon: <Backpack />,
        href: '/maplestory/equipment?scope=other',
      },
    ],
  },
  {
    id: 'items',
    label: 'Items',
    description: 'Browse items by category',
    children: [
      {
        id: 'all-items',
        label: 'All Items',
        description: 'Browse every non-equipment item',
        icon: <Package />,
        href: '/maplestory/items',
      },
      {
        id: 'use-items',
        label: 'Use',
        description: 'Browse Use items',
        icon: <Package />,
        href: '/maplestory/items/use',
      },
      {
        id: 'etc-items',
        label: 'ETC',
        description: 'Browse ETC items',
        icon: <Package />,
        href: '/maplestory/items/etc',
      },
      {
        id: 'setup-items',
        label: 'Set-up',
        description: 'Browse Set-up items',
        icon: <Package />,
        href: '/maplestory/items/setup',
      },
      {
        id: 'cash-items',
        label: 'Cash/Pet',
        description: 'Browse Cash items and Pets',
        icon: <Package />,
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
