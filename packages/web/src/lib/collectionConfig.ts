import {
  AcquisitionSource,
  ConditionGrade,
  StarWarsLine,
  StarWarsCategory,
  FigureSize,
  CardbackStyle,
  TransformersFaction,
  TransformersLine,
  TransformerSize,
  MastersLine,
  MastersCharacterType,
  WishlistPriority,
} from '@my-collections/shared';

export const DEFAULT_PAGE_SIZE = 50;
export const WISHLIST_PAGE_SIZE = 50;
export const MAX_USER_ITEMS_FETCH = 500;

export type CollectionKey = 'star-wars' | 'transformers' | 'he-man';

export interface FilterOption {
  value: string;
  label: string;
}

export interface CollectionConfig {
  key: CollectionKey;
  label: string;
  emoji: string;
  apiPath: string;
  lineLabel: string | null;
  lineOptions: FilterOption[] | null;
  factionOptions: FilterOption[] | null;
}

// Human-readable labels for all enum values used in filters and display

export const CONDITION_LABELS: Record<string, string> = {
  [ConditionGrade.MINT]: 'C10 — Mint',
  [ConditionGrade.NEAR_MINT]: 'C9 — Near Mint',
  [ConditionGrade.VERY_FINE]: 'C8 — Very Fine',
  [ConditionGrade.FINE]: 'C7 — Fine',
  [ConditionGrade.VERY_GOOD]: 'C6 — Very Good',
  [ConditionGrade.GOOD]: 'C5 — Good',
  [ConditionGrade.POOR]: 'C4 — Poor',
  [ConditionGrade.INCOMPLETE]: 'INC — Incomplete',
};

export const STAR_WARS_CATEGORY_LABELS: Record<string, string> = {
  [StarWarsCategory.BASIC_FIGURE]: 'Basic Figure',
  [StarWarsCategory.VEHICLE]: 'Vehicle',
  [StarWarsCategory.PLAYSET]: 'Playset',
  [StarWarsCategory.CREATURE]: 'Creature',
  [StarWarsCategory.MINI_RIG]: 'Mini-Rig',
  [StarWarsCategory.ACCESSORY]: 'Accessory',
  [StarWarsCategory.TWELVE_INCH]: '12" Figure',
  [StarWarsCategory.COLLECTOR_CASE]: 'Collector Case',
  [StarWarsCategory.ROLEPLAY]: 'Role Play',
  [StarWarsCategory.DIE_CAST]: 'Die Cast',
};

export const WISHLIST_PRIORITY_LABELS: Record<string, string> = {
  [WishlistPriority.HIGH]: 'High',
  [WishlistPriority.MEDIUM]: 'Medium',
  [WishlistPriority.LOW]: 'Low',
};

export const STAR_WARS_LINE_LABELS: Record<string, string> = {
  [StarWarsLine.STAR_WARS]: 'Star Wars (1977–78)',
  [StarWarsLine.EMPIRE_STRIKES_BACK]: 'Empire Strikes Back',
  [StarWarsLine.RETURN_OF_THE_JEDI]: 'Return of the Jedi',
  [StarWarsLine.POWER_OF_THE_FORCE]: 'Power of the Force',
};

export const FIGURE_SIZE_LABELS: Record<string, string> = {
  [FigureSize.SMALL]: '3¾"',
  [FigureSize.LARGE]: '12"',
  [FigureSize.MINI]: 'Mini',
};

export const CARDBACK_LABELS: Record<string, string> = {
  [CardbackStyle.TWELVE_BACK]: '12-Back',
  [CardbackStyle.TWENTY_BACK]: '20-Back',
  [CardbackStyle.THIRTY_ONE_BACK]: '31-Back',
  [CardbackStyle.FORTY_FIVE_BACK]: '45-Back',
  [CardbackStyle.FORTY_EIGHT_BACK]: '48-Back',
  [CardbackStyle.SIXTY_FIVE_BACK]: '65-Back',
  [CardbackStyle.SEVENTY_SEVEN_BACK]: '77-Back',
  [CardbackStyle.ESB_BACK]: 'ESB',
  [CardbackStyle.ROTJ_BACK]: 'ROTJ',
  [CardbackStyle.POTF_BACK]: 'POTF',
};

export const FACTION_LABELS: Record<string, string> = {
  [TransformersFaction.AUTOBOT]: 'Autobot',
  [TransformersFaction.DECEPTICON]: 'Decepticon',
};

export const TF_LINE_LABELS: Record<string, string> = {
  [TransformersLine.G1_SERIES_1]: 'Series 1 (1984)',
  [TransformersLine.G1_SERIES_2]: 'Series 2 (1985)',
  [TransformersLine.G1_SERIES_3]: 'Series 3 (1986)',
  [TransformersLine.G1_SERIES_4]: 'Series 4 (1987)',
  [TransformersLine.G1_SERIES_5]: 'Series 5 (1988)',
  [TransformersLine.G1_SERIES_6]: 'Series 6 (1989–90)',
};

export const TF_SIZE_LABELS: Record<string, string> = {
  [TransformerSize.MINI]: 'Mini',
  [TransformerSize.SMALL]: 'Small',
  [TransformerSize.MEDIUM]: 'Medium',
  [TransformerSize.LARGE]: 'Large',
  [TransformerSize.JUMBO]: 'Jumbo',
};

export const MASTERS_LINE_LABELS: Record<string, string> = {
  [MastersLine.ORIGINAL]: 'Original (1981–88)',
  [MastersLine.PRINCESS_OF_POWER]: 'Princess of Power',
  [MastersLine.GOLDEN_BOOKS]: 'Golden Books',
  [MastersLine.MINI]: 'Mini Figures',
};

export const MASTERS_CHARACTER_LABELS: Record<string, string> = {
  [MastersCharacterType.HEROIC_WARRIOR]: 'Heroic Warrior',
  [MastersCharacterType.EVIL_WARRIOR]: 'Evil Warrior',
  [MastersCharacterType.HEROIC_ALLY]: 'Heroic Ally',
  [MastersCharacterType.EVIL_ALLY]: 'Evil Ally',
  [MastersCharacterType.NEUTRAL]: 'Neutral',
};

function enumToOptions(labels: Record<string, string>): FilterOption[] {
  return Object.entries(labels).map(([value, label]) => ({ value, label }));
}

export const ACQUISITION_SOURCE_LABELS: Record<string, string> = {
  [AcquisitionSource.ORIGINAL]: 'Original Owner',
  [AcquisitionSource.EBAY]: 'eBay',
  [AcquisitionSource.ETSY]: 'Etsy',
  [AcquisitionSource.FLEA_MARKET]: 'Flea Market',
  [AcquisitionSource.ANTIQUE_STORE]: 'Antique Store',
  [AcquisitionSource.CONVENTION]: 'Convention',
  [AcquisitionSource.PRIVATE_SALE]: 'Private Sale',
  [AcquisitionSource.TRADE]: 'Trade',
  [AcquisitionSource.GIFT]: 'Gift',
  [AcquisitionSource.TOY_STORE]: 'Toy Store',
  [AcquisitionSource.OTHER]: 'Other',
};

export const CONDITION_OPTIONS: FilterOption[] = enumToOptions(CONDITION_LABELS);
export const ACQUISITION_SOURCE_OPTIONS: FilterOption[] = enumToOptions(ACQUISITION_SOURCE_LABELS);
export const STAR_WARS_CATEGORY_OPTIONS: FilterOption[] = enumToOptions(STAR_WARS_CATEGORY_LABELS);
export const WISHLIST_PRIORITY_OPTIONS: FilterOption[] = enumToOptions(WISHLIST_PRIORITY_LABELS);
export const MASTERS_LINE_OPTIONS: FilterOption[] = enumToOptions(MASTERS_LINE_LABELS);
export const MASTERS_CHARACTER_OPTIONS: FilterOption[] = enumToOptions(MASTERS_CHARACTER_LABELS);

export const COLLECTION_CONFIG: Record<CollectionKey, CollectionConfig> = {
  'star-wars': {
    key: 'star-wars',
    label: 'Star Wars',
    emoji: '⭐',
    apiPath: '/collections/star-wars',
    lineLabel: 'Line',
    lineOptions: enumToOptions(STAR_WARS_LINE_LABELS),
    factionOptions: null,
  },
  'transformers': {
    key: 'transformers',
    label: 'Transformers',
    emoji: '🤖',
    apiPath: '/collections/transformers',
    lineLabel: 'Series',
    lineOptions: enumToOptions(TF_LINE_LABELS),
    factionOptions: enumToOptions(FACTION_LABELS),
  },
  'he-man': {
    key: 'he-man',
    label: 'He-Man',
    emoji: '⚔️',
    apiPath: '/collections/he-man',
    lineLabel: 'Line',
    lineOptions: enumToOptions(MASTERS_LINE_LABELS),
    factionOptions: null,
  },
};

export function getConfig(key: string): CollectionConfig | null {
  return COLLECTION_CONFIG[key as CollectionKey] ?? null;
}
