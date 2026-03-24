import { CollectionItem, CollectionType } from './common.js';

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

export interface G1Transformer extends CollectionItem {
  collectionType: CollectionType.TRANSFORMERS;
  faction: TransformersFaction;
  line: TransformersLine;
  size: TransformerSize;
  altMode: string;                 // e.g., "Porsche 911", "F-15 fighter jet"
  isComplete: boolean;
  accessories: string[];
  ownedAccessories: string[];
  isBoxed: boolean;
  hasInstructions: boolean;
  hasTechSpec: boolean;            // Tech spec card
  isCombiner: boolean;
  combinerTeam?: string;           // e.g., "Aerialbots", "Stunticons"
  isGiftSet?: boolean;
  isMailaway?: boolean;
  japaneseRelease?: boolean;       // Takara version
  rubSign?: boolean;               // Heat-sensitive rub sign present
}
