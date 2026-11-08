import { Header } from '@mapletip/component-library';
import type { HeaderLink } from '@mapletip/component-library';
import { Link } from '@tanstack/react-router';

// `?no-inline` keeps these out of the JS bundle: they are all under Vite's 4 KB
// inline threshold and would otherwise ship as base64. Importing them lets the
// bundler resolve and content-hash each one, so a missing file fails the build.
import allEquipment from '@/assets/maplestory/navigation/equipment-all-maple-shield.png?no-inline';
import armorAccessories from '@/assets/maplestory/navigation/equipment-armor-zakum-helmet.png?no-inline';
import otherEquipment from '@/assets/maplestory/navigation/equipment-other-hog.png?no-inline';
import weapons from '@/assets/maplestory/navigation/equipment-weapons-maple-sword.png?no-inline';
import cashItems from '@/assets/maplestory/navigation/items-cash-pet-brown-puppy.png?no-inline';
import etcItems from '@/assets/maplestory/navigation/items-etc-snail-shell.png?no-inline';
import setupItems from '@/assets/maplestory/navigation/items-setup-blue-chair.png?no-inline';
import useItems from '@/assets/maplestory/navigation/items-use-red-potion.png?no-inline';

import classes from './AppHeader.module.css';
import { ItemCollectionIcon } from './ItemCollectionIcon';

/** Nexon sprite artwork is decorative; the adjacent label names the destination. */
function navigationIcon(src: string) {
  return <img src={src} alt="" width={22} height={22} decoding="async" />;
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
        icon: navigationIcon(allEquipment),
        href: '/maplestory/equipment',
      },
      {
        id: 'armor-accessories',
        label: 'Armor & accessories',
        description: 'Hats, clothing, accessories',
        icon: navigationIcon(armorAccessories),
        href: '/maplestory/equipment?scope=armor-accessories',
      },
      {
        id: 'weapons',
        label: 'Weapons',
        description: 'Explore weapons by family',
        icon: navigationIcon(weapons),
        href: '/maplestory/equipment?scope=weapons',
      },
      {
        id: 'other-equipment',
        label: 'Other equipment',
        description: 'Mounts and additional equipment',
        icon: navigationIcon(otherEquipment),
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
        icon: <ItemCollectionIcon />,
        href: '/maplestory/items',
      },
      {
        id: 'use-items',
        label: 'Use',
        description: 'Browse Use items',
        icon: navigationIcon(useItems),
        href: '/maplestory/items/use',
      },
      {
        id: 'etc-items',
        label: 'ETC',
        description: 'Browse ETC items',
        icon: navigationIcon(etcItems),
        href: '/maplestory/items/etc',
      },
      {
        id: 'setup-items',
        label: 'Set-up',
        description: 'Browse Set-up items',
        icon: navigationIcon(setupItems),
        href: '/maplestory/items/setup',
      },
      {
        id: 'cash-items',
        label: 'Cash',
        description: 'Browse Cash items and Pets',
        icon: navigationIcon(cashItems),
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
