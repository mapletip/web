import { world } from '../../src/mocks/world';
import { test, expect } from '../fixtures';

import { ItemsPage } from './page/items-page';

test('Items Browse shows named fixtures and filters quest rewards', async ({
  page,
}) => {
  const itemsPage = new ItemsPage(page);
  const namedItemCount = world.builds[0]?.items.filter(
    (item) =>
      item.name !== undefined &&
      item.category.kind === 'item-class' &&
      item.itemClass.state === 'known',
  ).length;
  if (namedItemCount === undefined)
    throw new Error('Missing Classic World fixture.');

  await itemsPage.goto('/maplestory/items/use/recovery');
  await expect(itemsPage.heading()).toBeVisible();
  await expect(itemsPage.item('Practice Tonic A')).toBeVisible();
  await expect(itemsPage.item('Flat HP Salve')).toBeVisible();
  await expect(itemsPage.item('Unnamed item')).toHaveCount(0);

  await itemsPage.goto('/maplestory/items');
  await expect(itemsPage.summary).toHaveText(`${namedItemCount} Items`);
  await expect(itemsPage.item('Unnamed item')).toHaveCount(0);

  await itemsPage.goto('/maplestory/items/etc/monster-drops');
  await expect(itemsPage.item('Given And Taken Sprout')).toBeVisible();
  await expect(itemsPage.item('Only Taken Sprout')).toBeVisible();
  await itemsPage.filterBy({ facet: 'Quests', option: 'Quest reward' });
  await expect(itemsPage.item('Given And Taken Sprout')).toBeVisible();
  await expect(itemsPage.item('Only Taken Sprout')).toHaveCount(0);
});
