import { useEffect, useState } from 'react';
import { CollectionIcon } from './collection-icons.js';
import type { CollectionKey } from '../../lib/collectionConfig.js';

const ACCENT_COLORS: Record<CollectionKey, string> = {
  'star-wars':    '#fbbf24',
  'transformers': '#60a5fa',
  'he-man':       '#c084fc',
};

const ICON_SIZE = 40;
const RING_RADIUS = 24;
const RING_STROKE = 3;
const SVG_SIZE = (RING_RADIUS + RING_STROKE / 2 + 1) * 2; // 51 → use 52
const CX = SVG_SIZE / 2;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

interface CollectionProgressIconProps {
  collectionKey: CollectionKey;
  owned: number;
  catalogTotal: number;
}

export function CollectionProgressIcon({ collectionKey, owned, catalogTotal }: CollectionProgressIconProps) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 80);
    return () => clearTimeout(t);
  }, []);

  const pct = catalogTotal > 0 ? Math.round((owned / catalogTotal) * 100) : 0;
  const dashOffset = animated ? CIRCUMFERENCE * (1 - pct / 100) : CIRCUMFERENCE;
  const color = ACCENT_COLORS[collectionKey];

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="relative" style={{ width: SVG_SIZE, height: SVG_SIZE }}>
        <svg
          width={SVG_SIZE}
          height={SVG_SIZE}
          className="absolute inset-0 -rotate-90"
          style={{ overflow: 'visible' }}
        >
          {/* track */}
          <circle
            cx={CX}
            cy={CX}
            r={RING_RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth={RING_STROKE}
            className="text-border opacity-40"
          />
          {/* progress */}
          <circle
            cx={CX}
            cy={CX}
            r={RING_RADIUS}
            fill="none"
            stroke={color}
            strokeWidth={RING_STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            style={{
              transition: 'stroke-dashoffset 1s ease-out',
              filter: `drop-shadow(0 0 4px ${color}88)`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <CollectionIcon variant={collectionKey} size={ICON_SIZE} />
        </div>
      </div>
      <span className="text-xs font-medium tabular-nums" style={{ color }}>
        {pct}%
      </span>
    </div>
  );
}
