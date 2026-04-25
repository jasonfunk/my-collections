import { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { CollectionType } from '@my-collections/shared';
import { CollectionIcon } from './CollectionIcon';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const ICON_SIZE = 36;
const RING_RADIUS = 22;
const RING_STROKE = 3;
const SVG_SIZE = 50;
const CX = SVG_SIZE / 2;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const ACCENT_COLORS: Record<CollectionType, string> = {
  [CollectionType.STAR_WARS]:    '#f59e0b',
  [CollectionType.TRANSFORMERS]: '#60a5fa',
  [CollectionType.HE_MAN]:       '#c084fc',
};

interface CollectionProgressIconProps {
  collectionType: CollectionType;
  owned: number;
  catalogTotal: number;
}

export function CollectionProgressIcon({ collectionType, owned, catalogTotal }: CollectionProgressIconProps) {
  const pct = catalogTotal > 0 ? Math.round((owned / catalogTotal) * 100) : 0;
  const color = ACCENT_COLORS[collectionType];

  const animValue = useRef(new Animated.Value(CIRCUMFERENCE)).current;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: CIRCUMFERENCE * (1 - pct / 100),
      duration: 1000,
      useNativeDriver: false, // stroke-dashoffset is not supported by native driver
    }).start();
  }, [animValue, pct]);

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: SVG_SIZE, height: SVG_SIZE }}>
        <Svg
          width={SVG_SIZE}
          height={SVG_SIZE}
          style={{ position: 'absolute', top: 0, left: 0, transform: [{ rotate: '-90deg' }] }}
        >
          {/* track */}
          <Circle
            cx={CX}
            cy={CX}
            r={RING_RADIUS}
            fill="none"
            stroke="#2a2a2a"
            strokeWidth={RING_STROKE}
          />
          {/* progress arc */}
          <AnimatedCircle
            cx={CX}
            cy={CX}
            r={RING_RADIUS}
            fill="none"
            stroke={color}
            strokeWidth={RING_STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={animValue}
          />
        </Svg>
        <View
          style={{
            position: 'absolute',
            width: SVG_SIZE,
            height: SVG_SIZE,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CollectionIcon type={collectionType} size={ICON_SIZE} />
        </View>
      </View>
      <Text style={{ fontSize: 10, fontWeight: '600', color, marginTop: 2 }}>{pct}%</Text>
    </View>
  );
}
