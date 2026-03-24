import { CollectionItem, CollectionType } from './common.js';

/**
 * Masters of the Universe — original Mattel line (1981–1988).
 */

export enum MastersLine {
  ORIGINAL = 'ORIGINAL',           // 1981–1988 core line
  PRINCESS_OF_POWER = 'POP',       // She-Ra line
  GOLDEN_BOOKS = 'GOLDEN_BOOKS',
  MINI = 'MINI',                    // Mini figures
}

export enum MastersCharacterType {
  HEROIC_WARRIOR = 'HEROIC',
  EVIL_WARRIOR = 'EVIL',
  HEROIC_ALLY = 'HEROIC_ALLY',
  EVIL_ALLY = 'EVIL_ALLY',
  NEUTRAL = 'NEUTRAL',
}

export interface MastersOfTheUniverseFigure extends CollectionItem {
  collectionType: CollectionType.HE_MAN;
  line: MastersLine;
  characterType: MastersCharacterType;
  releaseYear?: number;
  isVariant: boolean;
  variantDescription?: string;      // e.g., "first release", "cross sell back"
  accessories: string[];
  ownedAccessories: string[];
  isCarded: boolean;
  hasBackCard: boolean;             // mini-comic / back card intact
  miniComic?: string;               // title of included mini comic
  hasArmorOrFeature: boolean;       // battle armor, slime pit feature, etc.
  featureDescription?: string;
}
