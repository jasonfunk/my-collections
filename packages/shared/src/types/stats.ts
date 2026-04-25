import { CollectionType } from './common.js';

export interface CollectionTypeStats {
  owned: number;
  wishlist: number;
  estimatedTotalValue: number | null;
  catalogTotal: number;
}

export interface CollectionStats {
  starWars: CollectionTypeStats;
  transformers: CollectionTypeStats;
  heman: CollectionTypeStats;
  totals: {
    owned: number;
    wishlist: number;
    estimatedTotalValue: number | null;
  };
}

export interface RecentCollectionItem {
  id: string;
  name: string;
  collectionType: CollectionType;
  isOwned: boolean;
  condition?: string;
  createdAt: string;
}
