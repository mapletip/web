import { Header } from '@mapletip/component-library';
import type { HeaderLink } from '@mapletip/component-library';
import { Link } from '@tanstack/react-router';

import classes from './AppHeader.module.css';

/** Nexon sprite artwork is decorative; the adjacent label names the destination. */
function sprite(file: string) {
  return (
    <img
      src={`/navigation/${file}`}
      alt=""
      width={22}
      height={22}
      decoding="async"
    />
  );
}

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
        icon: sprite('equipment-all-maple-shield.avif'),
        href: '/maplestory/equipment',
      },
      {
        id: 'armor-accessories',
        label: 'Armor & accessories',
        description: 'Hats, clothing, accessories',
        icon: sprite('equipment-armor-zakum-helmet.avif'),
        href: '/maplestory/equipment?scope=armor-accessories',
      },
      {
        id: 'weapons',
        label: 'Weapons',
        description: 'Explore weapons by family',
        icon: sprite('equipment-weapons-maple-sword.avif'),
        href: '/maplestory/equipment?scope=weapons',
      },
      {
        id: 'other-equipment',
        label: 'Other equipment',
        description: 'Mounts and additional equipment',
        icon: sprite('equipment-other-hog.avif'),
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
        icon: sprite('items-all-meso-pouch.avif'),
        href: '/maplestory/items',
      },
      {
        id: 'use-items',
        label: 'Use',
        description: 'Browse Use items',
        icon: sprite('items-use-red-potion.avif'),
        href: '/maplestory/items/use',
      },
      {
        id: 'etc-items',
        label: 'ETC',
        description: 'Browse ETC items',
        icon: sprite('items-etc-snail-shell.avif'),
        href: '/maplestory/items/etc',
      },
      {
        id: 'setup-items',
        label: 'Set-up',
        description: 'Browse Set-up items',
        icon: sprite('items-setup-blue-chair.avif'),
        href: '/maplestory/items/setup',
      },
      {
        id: 'cash-items',
        label: 'Cash/Pet',
        description: 'Browse Cash items and Pets',
        icon: sprite('items-cash-pet-brown-puppy.avif'),
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
  {
    id: 'forums',
    label: 'Forums',
    href: 'https://forums.mapletip.com',
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
