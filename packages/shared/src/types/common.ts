/**
 * Condition grades used across all collections.
 * Based on standard collector grading conventions.
 */
export enum ConditionGrade {
  MINT = 'C10',           // Perfect, unplayed with
  NEAR_MINT = 'C9',       // Nearly perfect, minimal wear
  VERY_FINE = 'C8',       // Light play wear, all parts present
  FINE = 'C7',            // Moderate play wear
  VERY_GOOD = 'C6',       // Heavier wear, all major parts present
  GOOD = 'C5',            // Well played with
  POOR = 'C4',            // Heavy wear, possible damage
  INCOMPLETE = 'INC',     // Missing parts
}

/**
 * Packaging condition — separate from the figure/item condition.
 */
export enum PackagingCondition {
  SEALED = 'SEALED',         // Never opened
  COMPLETE = 'C9',           // Opened but complete with all inserts
  GOOD = 'GOOD',             // Some shelf wear
  FAIR = 'FAIR',             // Notable wear, creases, fading
  POOR = 'POOR',             // Heavy damage
  NONE = 'NONE',             // No packaging
}

/**
 * Where the item was acquired.
 */
export enum AcquisitionSource {
  ORIGINAL = 'ORIGINAL',       // Owned since childhood
  EBAY = 'EBAY',
  ETSY = 'ETSY',
  FLEA_MARKET = 'FLEA_MARKET',
  ANTIQUE_STORE = 'ANTIQUE_STORE',
  CONVENTION = 'CONVENTION',
  PRIVATE_SALE = 'PRIVATE_SALE',
  TRADE = 'TRADE',
  GIFT = 'GIFT',
  TOY_STORE = 'TOY_STORE',
  OTHER = 'OTHER',
}

/**
 * Base interface for all collection items across every collection type.
 * Think of this as an abstract base class — every specific collection
 * item type (StarWarsFigure, Transformer, etc.) extends this.
 */
export interface CollectionItem {
  id: string;
  name: string;
  collectionType: CollectionType;
  condition?: ConditionGrade;
  packagingCondition?: PackagingCondition;
  isOwned: boolean;          // false = on wishlist
  isComplete: boolean;       // all accessories/parts present
  acquisitionSource?: AcquisitionSource;
  acquisitionDate?: string;  // ISO 8601 date string
  acquisitionPrice?: number; // in USD
  estimatedValue?: number;   // current market estimate in USD
  isVariant?: boolean;        // item is a known production variant
  notes?: string;
  photoUrls: string[];
  createdAt: string;         // ISO 8601
  updatedAt: string;         // ISO 8601
}

export enum CollectionType {
  STAR_WARS = 'STAR_WARS',
  TRANSFORMERS = 'TRANSFORMERS',
  HE_MAN = 'HE_MAN',
}

/**
 * Wishlist priority for unowned items across all collections.
 */
export enum WishlistPriority {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}
