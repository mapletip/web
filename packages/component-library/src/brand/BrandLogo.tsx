import type { ReactElement } from 'react';

/**
 * MapleTip authoritative leaf-and-spark mark SVG.
 * Source: launchpad-zero/mapletip -> apps/web/public/brand/mapletip-mark.svg
 */
export function MapleTipMark({
  size = 40,
}: {
  readonly size?: number;
}): ReactElement {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      fill="none"
      width={size}
      height={size}
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="leaf-gradient"
          x1="8"
          y1="55"
          x2="51"
          y2="8"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#E90045" />
          <stop offset="0.52" stopColor="#FF3F3F" />
          <stop offset="1" stopColor="#FFB33F" />
        </linearGradient>
        <linearGradient
          id="spark-gradient"
          x1="48"
          y1="18"
          x2="58"
          y2="7"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FF8B22" />
          <stop offset="1" stopColor="#FFC13D" />
        </linearGradient>
      </defs>
      <path
        d="M32 3h-.67L26.6 7.72l-2.69 3.71-1.69 3.37-1.01 3.37v5.4l-.34.34-4.38-2.7-4.05-1.01H7.05l-2.03.67.34 4.05 1.69 6.07 2.02 3.71 4.05 4.38-2.03.68-2.69 1.68-3.38 3.71-1.35 2.36v.68l1.02 1.01 3.37 1.68 4.38 1.02h3.37l5.4-1.35 4.05-2.36.33.33-2.36 3.71-4.04 4.05-2.03 1.35v1.35l2.03 2.02h1.01l4.38-4.05 2.36-3.37 2.03-4.04 1.34-3.04h.34l3.37 4.05 4.05 2.69 3.37 1.35 4.05.68 3.71-.34 3.71-1.01 2.36-1.01-.34-1.01-2.36-3.71-3.03-2.7-2.7-1.69-3.37-1.35-.68-.67 5.06-1.35 4.72-2.36 3.04-2.36 3.03-3.37 1.69-3.04.67-2.7-.67-.67-3.71-1.01h-3.38l-3.37.67-3.37 1.35-3.37 2.03-2.03 1.68-1.34 1.01h-.34l1.01-4.38.34-3.71-.34-3.71-1.01-4.05-1.69-4.38-2.36-4.04L32 3Z"
        fill="url(#leaf-gradient)"
        stroke="#D9183E"
        strokeWidth="0.55"
        strokeLinejoin="round"
      />
      <path
        d="M53.58 5.36h-.67l-.68.67-1.35 4.05-1.01 1.01-3.71 1.35-.67.68.34.67 2.69 1.01 2.03 1.35 1.35 4.05 1.01 1.01.67-.68 1.69-4.04.67-.68 4.39-2.02-.34-1.01h-.68l-4.04-2.36-1.69-5.06Z"
        fill="url(#spark-gradient)"
        stroke="#E97E19"
        strokeWidth="0.45"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * MapleTip logo and two-tone brand wordmark.
 */
export function MapleTipBrandHeader(): ReactElement {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '12px',
        userSelect: 'none',
      }}
    >
      <MapleTipMark size={36} />
      <span
        style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}
      >
        <span style={{ color: 'var(--mapletip-color-ink)' }}>Maple</span>
        <span style={{ color: 'var(--mapletip-color-brand)' }}>Tip</span>
      </span>
    </div>
  );
}
