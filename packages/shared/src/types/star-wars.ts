import { AcquisitionSource, CollectionItem, CollectionType, ConditionGrade, PackagingCondition, WishlistPriority } from './common.js';

/**
 * Original Kenner Star Wars action figures (1977–1985).
 */

export enum StarWarsLine {
  STAR_WARS = 'STAR_WARS',                   // 1977–1978
  EMPIRE_STRIKES_BACK = 'EMPIRE_STRIKES_BACK', // 1980–1982
  RETURN_OF_THE_JEDI = 'RETURN_OF_THE_JEDI',  // 1983–1984
  POWER_OF_THE_FORCE = 'POWER_OF_THE_FORCE',  // 1984–1985
}

export enum FigureSize {
  SMALL = '3.75',   // Standard 3¾ inch
  LARGE = '12',     // 12-inch large figures
  MINI = 'MINI',    // Mini-rigs and mini figures
}

/**
 * Card backs vary by figure and year — tracking these is important
 * for completeness and variant collectors.
 */
export enum CardbackStyle {
  TWELVE_BACK = '12_BACK',
  TWENTY_BACK = '20_BACK',
  THIRTY_ONE_BACK = '31_BACK',
  FORTY_FIVE_BACK = '45_BACK',
  FORTY_EIGHT_BACK = '48_BACK',
  SIXTY_FIVE_BACK = '65_BACK',
  SEVENTY_SEVEN_BACK = '77_BACK',
  ESB_BACK = 'ESB',
  ROTJ_BACK = 'ROTJ',
  POTF_BACK = 'POTF',
}

/**
 * What type of product it is — figures, vehicles, playsets, etc.
 */
export enum StarWarsCategory {
  BASIC_FIGURE = 'BASIC_FIGURE',
  VEHICLE = 'VEHICLE',
  PLAYSET = 'PLAYSET',
  CREATURE = 'CREATURE',
  MINI_RIG = 'MINI_RIG',
  ACCESSORY = 'ACCESSORY',
  TWELVE_INCH = 'TWELVE_INCH',
  COLLECTOR_CASE = 'COLLECTOR_CASE',
  ROLEPLAY = 'ROLEPLAY',
  DIE_CAST = 'DIE_CAST',
}

/**
 * What Kenner made — shared catalog entry, no userId.
 * Figure-specific and vehicle-specific fields are nullable
 * because one table covers all categories.
 */
export interface StarWarsCatalogItem {
  id: string;
  name: string;
  category: StarWarsCategory;
  line?: StarWarsLine;
  accessories: string[];          // what should come with it
  catalogImageUrl?: string;
  sourceUrl?: string;             // transformerland detail page URL
  externalId?: string;            // transformerland item ID (from URL slug)
  isVariant: boolean;
  variantDescription?: string;    // e.g., "vinyl cape", "cloth cape"

  // Figure-specific (null for vehicles/playsets)
  figureSize?: FigureSize;
  cardbackStyle?: CardbackStyle;
  kennerItemNumber?: string;
  coinIncluded?: boolean;         // POTF coins

  // Vehicle/Playset-specific (null for figures)
  features?: string[];            // e.g., "opening cockpit", "firing missiles"

  createdAt: string;              // ISO 8601
  updatedAt: string;              // ISO 8601
}

/**
 * A user's personal record for one catalog item — what they own or want.
 * Created when a user claims an item from the catalog.
 */
export interface UserStarWarsItem {
  id: string;
  catalogId: string;
  userId: string;
  catalog?: StarWarsCatalogItem;  // populated in API responses

  isOwned: boolean;
  wishlistPriority?: WishlistPriority;  // meaningful only when !isOwned
  condition?: ConditionGrade;
  packagingCondition?: PackagingCondition;
  isComplete: boolean;
  ownedAccessories: string[];     // subset of catalog accessories actually owned
  isCarded: boolean;              // still on original card
  isBoxed: boolean;               // still in original box (vehicles/playsets)

  acquisitionSource?: AcquisitionSource;
  acquisitionDate?: string;       // ISO 8601
  acquisitionPrice?: number;      // in USD
  estimatedValue?: number;        // current market estimate in USD

  notes?: string;
  photoUrls: string[];

  createdAt: string;              // ISO 8601
  updatedAt: string;              // ISO 8601
}

/**
 * @deprecated Use StarWarsCatalogItem + UserStarWarsItem instead.
 * Kept for backward compatibility while the API and web are migrated.
 */
export interface StarWarsFigure extends CollectionItem {
  collectionType: CollectionType.STAR_WARS;
  line: StarWarsLine;
  figureSize: FigureSize;
  isVariant: boolean;
  variantDescription?: string;
  cardbackStyle?: CardbackStyle;
  isCarded: boolean;
  accessories: string[];
  ownedAccessories: string[];
  coinIncluded?: boolean;
  kennerItemNumber?: string;
}
