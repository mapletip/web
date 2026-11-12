export function dropActionLabel(name: string, count: number): string {
  const countText = count.toLocaleString('en-US');
  const dropCount =
    count === 0 ? countText : `${countText} ${count === 1 ? 'drop' : 'drops'}`;
  return `${name}, ${dropCount}. Show drops.`;
}
