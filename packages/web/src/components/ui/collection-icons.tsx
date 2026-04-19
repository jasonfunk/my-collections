import type { CollectionKey } from '@/lib/collectionConfig';

interface CollectionIconProps {
  variant: CollectionKey;
  size?: number;
  className?: string;
}

function StarWarsIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Lightsaber blade */}
      <rect x="22" y="2" width="2" height="12" rx="1" fill="#7dd3fc" />
      {/* Head */}
      <circle cx="16" cy="9" r="4" fill="#f59e0b" />
      {/* Robe body */}
      <path d="M12 14 L20 14 L22 30 L10 30 Z" fill="#f59e0b" />
      {/* Center robe line */}
      <line x1="16" y1="14" x2="16" y2="29" stroke="rgba(0,0,0,0.2)" strokeWidth="1.5" />
      {/* Left arm */}
      <rect x="8" y="14" width="3" height="7" rx="1.5" fill="#f59e0b" />
      {/* Right arm (holding lightsaber hilt) */}
      <rect x="21" y="14" width="3" height="5" rx="1.5" fill="#f59e0b" />
    </svg>
  );
}

function TransformersIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Square head */}
      <rect x="11" y="2" width="10" height="9" rx="1.5" fill="#60a5fa" />
      {/* Visor */}
      <rect x="12.5" y="4.5" width="7" height="2.5" rx="0.5" fill="rgba(0,0,0,0.35)" />
      {/* Blocky torso */}
      <rect x="9" y="12" width="14" height="11" rx="1.5" fill="#60a5fa" />
      {/* Chest divider */}
      <line x1="16" y1="12" x2="16" y2="23" stroke="rgba(0,0,0,0.2)" strokeWidth="1.5" />
      {/* Left arm */}
      <rect x="5" y="12" width="4" height="9" rx="1" fill="#60a5fa" />
      {/* Right arm */}
      <rect x="23" y="12" width="4" height="9" rx="1" fill="#60a5fa" />
      {/* Gun barrel */}
      <rect x="27" y="14" width="5" height="3" rx="0.5" fill="#60a5fa" />
      {/* Legs */}
      <rect x="10" y="24" width="5" height="7" rx="1" fill="#60a5fa" />
      <rect x="17" y="24" width="5" height="7" rx="1" fill="#60a5fa" />
    </svg>
  );
}

function HeManIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Axe handle */}
      <rect x="24" y="11" width="2" height="10" rx="0.5" fill="#c084fc" />
      {/* Axe head */}
      <rect x="22.5" y="8" width="5" height="4" rx="1" fill="#c084fc" />
      {/* Head */}
      <circle cx="16" cy="9" r="4" fill="#c084fc" />
      {/* Torso */}
      <rect x="11" y="14" width="10" height="9" rx="2" fill="#c084fc" />
      {/* X chest straps */}
      <line x1="11" y1="14" x2="21" y2="23" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" />
      <line x1="21" y1="14" x2="11" y2="23" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" />
      {/* Left arm */}
      <rect x="7" y="14" width="3.5" height="8" rx="1.5" fill="#c084fc" />
      {/* Right arm (holding axe) */}
      <rect x="21.5" y="14" width="3.5" height="8" rx="1.5" fill="#c084fc" />
      {/* Legs */}
      <rect x="11" y="24" width="4" height="7" rx="1.5" fill="#c084fc" />
      <rect x="17" y="24" width="4" height="7" rx="1.5" fill="#c084fc" />
    </svg>
  );
}

export function CollectionIcon({ variant, size = 32, className }: CollectionIconProps) {
  const icon = {
    'star-wars': <StarWarsIcon size={size} />,
    'transformers': <TransformersIcon size={size} />,
    'he-man': <HeManIcon size={size} />,
  }[variant];

  return <span className={className}>{icon}</span>;
}
