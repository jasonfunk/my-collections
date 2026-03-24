import { CollectionItem, CollectionType } from './common.js';

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

export interface StarWarsFigure extends CollectionItem {
  collectionType: CollectionType.STAR_WARS;
  line: StarWarsLine;
  figureSize: FigureSize;
  isVariant: boolean;
  variantDescription?: string;   // e.g., "vinyl cape", "cloth cape", "double telescoping lightsaber"
  cardbackStyle?: CardbackStyle; // if carded
  isCarded: boolean;             // still on original card
  accessories: string[];         // list of accessories that should be present
  ownedAccessories: string[];    // subset of accessories actually owned
  coinIncluded?: boolean;        // POTF coins
  kennerItemNumber?: string;     // catalog number printed on packaging
}
