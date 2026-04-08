import { AcquisitionSource, CollectionItem, CollectionType, ConditionGrade, PackagingCondition, WishlistPriority } from './common.js';

/**
 * Generation 1 Transformers (Hasbro/Takara, 1984–1990).
 */

export enum TransformersFaction {
  AUTOBOT = 'AUTOBOT',
  DECEPTICON = 'DECEPTICON',
}

export enum TransformersLine {
  G1_SERIES_1 = 'G1_S1',   // 1984
  G1_SERIES_2 = 'G1_S2',   // 1985
  G1_SERIES_3 = 'G1_S3',   // 1986
  G1_SERIES_4 = 'G1_S4',   // 1987
  G1_SERIES_5 = 'G1_S5',   // 1988
  G1_SERIES_6 = 'G1_S6',   // 1989–1990
}

export enum TransformerSize {
  MINI = 'MINI',           // Mini vehicles, cassettes
  SMALL = 'SMALL',         // Cars, smaller jets
  MEDIUM = 'MEDIUM',
  LARGE = 'LARGE',         // Seekers, larger vehicles
  JUMBO = 'JUMBO',         // Combiners, Fortress Maximus
}

/**
 * What Hasbro/Takara made — shared catalog entry, no userId.
 */
export interface G1TransformersCatalogItem {
  id: string;
  name: string;
  faction: TransformersFaction;
  line?: TransformersLine;
  size?: TransformerSize;
  altMode?: string;               // e.g., "Porsche 911", "F-15 fighter jet"
  accessories: string[];          // what should come with it
  catalogImageUrl?: string;
  sourceUrl?: string;
  externalId?: string;
  isVariant: boolean;
  variantDescription?: string;
  isCombiner: boolean;
  combinerTeam?: string;          // e.g., "Aerialbots", "Stunticons"
  isGiftSet: boolean;
  isMailaway: boolean;
  japaneseRelease: boolean;       // Takara version

  createdAt: string;              // ISO 8601
  updatedAt: string;              // ISO 8601
}

/**
 * A user's personal record for one G1 Transformers catalog item.
 */
export interface UserG1TransformersItem {
  id: string;
  catalogId: string;
  userId: string;
  catalog?: G1TransformersCatalogItem;

  isOwned: boolean;
  wishlistPriority?: WishlistPriority;
  condition?: ConditionGrade;
  packagingCondition?: PackagingCondition;
  isComplete: boolean;
  ownedAccessories: string[];
  isBoxed: boolean;
  hasInstructions: boolean;
  hasTechSpec: boolean;           // Tech spec card
  rubSign?: boolean;              // Heat-sensitive rub sign present

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
 * @deprecated Use G1TransformersCatalogItem + UserG1TransformersItem instead.
 * Kept for backward compatibility while the API and web are migrated.
 */
export interface G1Transformer extends CollectionItem {
  collectionType: CollectionType.TRANSFORMERS;
  faction: TransformersFaction;
  line: TransformersLine;
  size: TransformerSize;
  altMode: string;
  isComplete: boolean;
  accessories: string[];
  ownedAccessories: string[];
  isBoxed: boolean;
  hasInstructions: boolean;
  hasTechSpec: boolean;
  isCombiner: boolean;
  combinerTeam?: string;
  isGiftSet?: boolean;
  isMailaway?: boolean;
  japaneseRelease?: boolean;
  rubSign?: boolean;
}
