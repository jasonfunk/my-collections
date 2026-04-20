import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { CollectionType } from '@my-collections/shared';

function StarWarsIcon({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Rect x="22" y="2" width="2" height="12" rx="1" fill="#7dd3fc" />
      <Circle cx="16" cy="9" r="4" fill="#f59e0b" />
      <Path d="M12 14 L20 14 L22 30 L10 30 Z" fill="#f59e0b" />
      <Line x1="16" y1="14" x2="16" y2="29" stroke="rgba(0,0,0,0.2)" strokeWidth="1.5" />
      <Rect x="8" y="14" width="3" height="7" rx="1.5" fill="#f59e0b" />
      <Rect x="21" y="14" width="3" height="5" rx="1.5" fill="#f59e0b" />
    </Svg>
  );
}

function TransformersIcon({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Rect x="11" y="2" width="10" height="9" rx="1.5" fill="#60a5fa" />
      <Rect x="12.5" y="4.5" width="7" height="2.5" rx="0.5" fill="rgba(0,0,0,0.35)" />
      <Rect x="9" y="12" width="14" height="11" rx="1.5" fill="#60a5fa" />
      <Line x1="16" y1="12" x2="16" y2="23" stroke="rgba(0,0,0,0.2)" strokeWidth="1.5" />
      <Rect x="5" y="12" width="4" height="9" rx="1" fill="#60a5fa" />
      <Rect x="23" y="12" width="4" height="9" rx="1" fill="#60a5fa" />
      <Rect x="27" y="14" width="5" height="3" rx="0.5" fill="#60a5fa" />
      <Rect x="10" y="24" width="5" height="7" rx="1" fill="#60a5fa" />
      <Rect x="17" y="24" width="5" height="7" rx="1" fill="#60a5fa" />
    </Svg>
  );
}

function HeManIcon({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Rect x="24" y="11" width="2" height="10" rx="0.5" fill="#c084fc" />
      <Rect x="22.5" y="8" width="5" height="4" rx="1" fill="#c084fc" />
      <Circle cx="16" cy="9" r="4" fill="#c084fc" />
      <Rect x="11" y="14" width="10" height="9" rx="2" fill="#c084fc" />
      <Line x1="11" y1="14" x2="21" y2="23" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" />
      <Line x1="21" y1="14" x2="11" y2="23" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" />
      <Rect x="7" y="14" width="3.5" height="8" rx="1.5" fill="#c084fc" />
      <Rect x="21.5" y="14" width="3.5" height="8" rx="1.5" fill="#c084fc" />
      <Rect x="11" y="24" width="4" height="7" rx="1.5" fill="#c084fc" />
      <Rect x="17" y="24" width="4" height="7" rx="1.5" fill="#c084fc" />
    </Svg>
  );
}

export function CollectionIcon({ type, size = 32 }: { type: CollectionType; size?: number }) {
  switch (type) {
    case CollectionType.STAR_WARS:
      return <StarWarsIcon size={size} />;
    case CollectionType.TRANSFORMERS:
      return <TransformersIcon size={size} />;
    case CollectionType.HE_MAN:
      return <HeManIcon size={size} />;
  }
}

export function FaviconIcon({ size = 64 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Circle cx="16" cy="8.5" r="4" fill="#f59e0b" />
      <Rect x="11" y="14" width="10" height="8" rx="2" fill="#f59e0b" />
      <Rect x="7" y="14" width="3.5" height="7" rx="1.5" fill="#f59e0b" />
      <Rect x="21.5" y="14" width="3.5" height="7" rx="1.5" fill="#f59e0b" />
      <Rect x="11" y="23" width="4" height="6" rx="1.5" fill="#f59e0b" />
      <Rect x="17" y="23" width="4" height="6" rx="1.5" fill="#f59e0b" />
    </Svg>
  );
}
