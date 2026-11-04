# `@mapletip/web`

TanStack Start website foundation.

## Run

From the repository root or from this directory:

```sh
pnpm dev
```

The app starts at <http://localhost:3000>. Storybook remains separate:
`pnpm storybook` at <http://localhost:6006>.

## Navigation sprites

`public/navigation/` holds nine curated Classic MapleStory sprites used as decorative
category images in the Equipment and Items header groups. They are static files, not a
media pipeline: `AppHeader.tsx` references them by path and the shared `Header` never
sees a game asset.

| File                                 | Item                  | Item ID    | Source build         | Source                                                                                |
| ------------------------------------ | --------------------- | ---------- | -------------------- | ------------------------------------------------------------------------------------- |
| `equipment-all-maple-shield.avif`    | Maple Shield          | `1092030`  | GMS v83              | `gms_v83_wztoweb` `WEB/Shield/images/000030_01_Icon.png`                              |
| `equipment-armor-zakum-helmet.avif`  | Zakum Helmet          | `1002357`  | GMS v83              | `gms_v83_wztoweb` `WEB/Cap/images/000437_01_Icon.png`                                 |
| `equipment-weapons-maple-sword.avif` | Maple Sword           | `1302020`  | GMS v83              | `gms_v83_wztoweb` `WEB/Weapon/images/000020_01_Icon.png`                              |
| `equipment-other-hog.avif`           | Hog                   | `1902000`  | GMS v83              | `gms_v83_wztoweb` `WEB/TamingMob/images/000000_01_Icon.png`                           |
| `items-all-meso-pouch.avif`          | Mysterious Meso Pouch | `02028000` | Classic World launch | `launchpad-zero/mapletip` `public/images/item-browse/use-mysterious-meso-pouch.png`   |
| `items-use-red-potion.avif`          | Red Potion            | `02000000` | Classic World launch | `launchpad-zero/mapletip` `public/images/item-browse/use-red-potion.png`              |
| `items-etc-snail-shell.avif`         | Snail Shell           | `04000001` | Classic World launch | `launchpad-zero/mapletip` `public/images/item-browse/etc-snail-shell.png`             |
| `items-setup-blue-chair.avif`        | Sky-blue Wooden Chair | `03010003` | Classic World launch | `launchpad-zero/mapletip` `public/images/item-browse/setup-sky-blue-wooden-chair.png` |
| `items-cash-pet-brown-puppy.avif`    | Brown Puppy           | `05000001` | Classic World launch | `launchpad-zero/mapletip` `public/images/item-browse/cash-pet-brown-puppy.png`        |

Each equipment ID was resolved against the source export's own `data.json` item
metadata rather than inferred from the file index: Zakum Helmet `1002357` maps to
`Cap` image **437**, not 357. The five item sprites keep the IDs recorded in the
previous MapleTip build's icon provenance; note that Classic World and GMS v83 assign
different IDs to the same item (Snail Shell is `04000001` in Classic World and
`04000019` in GMS v83), so the build is part of the identity.

Conversion: `sharp` lossless AVIF (`{ lossless: true, effort: 9 }`) from the source
PNG at native resolution, no resizing or trimming. Every output decodes back to pixels
byte-identical to its source and keeps its alpha channel.

Rights: the artwork is Nexon's. A source repository's code licence does not licence the
sprite files. They are used here at icon size for identification in a fan reference
project; they are not redistributed as a game asset set.
