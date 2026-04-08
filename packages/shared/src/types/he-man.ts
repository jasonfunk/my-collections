import { AcquisitionSource, CollectionItem, CollectionType, ConditionGrade, PackagingCondition, WishlistPriority } from './common.js';

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

/**
 * What Mattel made — shared catalog entry, no userId.
 */
export interface MastersCatalogItem {
  id: string;
  name: string;
  line?: MastersLine;
  characterType?: MastersCharacterType;
  releaseYear?: number;
  accessories: string[];          // what should come with it
  catalogImageUrl?: string;
  sourceUrl?: string;
  externalId?: string;
  isVariant: boolean;
  variantDescription?: string;    // e.g., "first release", "cross sell back"
  miniComic?: string;             // title of included mini comic
  hasArmorOrFeature: boolean;     // battle armor, slime pit feature, etc.
  featureDescription?: string;

  createdAt: string;              // ISO 8601
  updatedAt: string;              // ISO 8601
}

/**
 * A user's personal record for one Masters of the Universe catalog item.
 */
export interface UserMastersItem {
  id: string;
  catalogId: string;
  userId: string;
  catalog?: MastersCatalogItem;

  isOwned: boolean;
  wishlistPriority?: WishlistPriority;
  condition?: ConditionGrade;
  packagingCondition?: PackagingCondition;
  isComplete: boolean;
  ownedAccessories: string[];
  isCarded: boolean;
  hasBackCard: boolean;           // mini-comic / back card intact

  acquisitionSource?: AcquisitionSource;
  acquisitionDate?: string;       // ISO 8601
  acquisitionPrice?: number;
  estimatedValue?: number;

  notes?: string;
  photoUrls: string[];

  createdAt: string;              // ISO 8601
  updatedAt: string;              // ISO 8601
}

/**
 * @deprecated Use MastersCatalogItem + UserMastersItem instead.
 * Kept for backward compatibility while the API and web are migrated.
 */
export interface MastersOfTheUniverseFigure extends CollectionItem {
  collectionType: CollectionType.HE_MAN;
  line: MastersLine;
  characterType: MastersCharacterType;
  releaseYear?: number;
  isVariant: boolean;
  variantDescription?: string;
  accessories: string[];
  ownedAccessories: string[];
  isCarded: boolean;
  hasBackCard: boolean;
  miniComic?: string;
  hasArmorOrFeature: boolean;
  featureDescription?: string;
}
