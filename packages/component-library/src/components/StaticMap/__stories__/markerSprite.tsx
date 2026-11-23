import type { ReactElement } from 'react';

interface MarkerSpriteOptions {
  readonly label: string;
  readonly color: string;
  readonly width?: string | undefined;
}

export function markerSprite({
  label,
  color,
  width = '100%',
}: MarkerSpriteOptions): ReactElement {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="64" viewBox="0 0 48 64"><path d="M24 2C12 2 3 11 3 23c0 15 21 39 21 39s21-24 21-39C45 11 36 2 24 2Z" fill="${color}" stroke="#fff" stroke-width="3"/><circle cx="24" cy="23" r="13" fill="#fff"/><text x="24" y="28" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="700" fill="#202020">${label}</text></svg>`;

  return (
    <img
      alt=""
      src={`data:image/svg+xml,${encodeURIComponent(svg)}`}
      style={{
        display: 'block',
        width,
        height: '100%',
        objectFit: 'contain',
      }}
    />
  );
}
