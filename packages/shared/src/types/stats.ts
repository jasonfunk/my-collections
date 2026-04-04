/**
 * Statistics shapes for the collections dashboard.
 * Produced by GET /collections/stats; consumed by web and mobile.
 */

export interface CollectionTypeStats {
  owned: number;
  wishlist: number;
  estimatedTotalValue: number | null;
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
