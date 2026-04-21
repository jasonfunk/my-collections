import { CollectionType } from '@my-collections/shared';
import type { PaginatedResponse } from '@my-collections/shared';
import { apiClient } from '../api/client';

export interface BrowseItem {
  id: string;
  catalogId: string;
  catalog?: { name: string };
  isOwned: boolean;
  condition?: string | null;
  estimatedValue?: number | null;
  createdAt: string;
}

export interface DetailItem {
  id: string;
  catalogId: string;
  catalog?: {
    name: string;
    accessories?: string[];
    category?: string;
    line?: string | null;
  };
  isOwned: boolean;
  wishlistPriority?: string | null;
  condition?: string | null;
  packagingCondition?: string | null;
  isComplete: boolean;
  ownedAccessories: string[];
  // Star Wars + He-Man
  isCarded?: boolean;
  // Star Wars
  isBoxed?: boolean;
  // He-Man
  hasBackCard?: boolean;
  // Transformers
  hasInstructions?: boolean;
  hasTechSpec?: boolean;
  rubSign?: boolean | null;
  // Acquisition
  acquisitionSource?: string | null;
  acquisitionDate?: string | null;
  acquisitionPrice?: number | null;
  estimatedValue?: number | null;
  notes?: string | null;
  photoUrls: string[];
  createdAt: string;
  updatedAt: string;
}

const ITEM_PATHS: Record<CollectionType, string> = {
  [CollectionType.STAR_WARS]: '/collections/star-wars/items',
  [CollectionType.TRANSFORMERS]: '/collections/transformers/items',
  [CollectionType.HE_MAN]: '/collections/he-man/items',
};

export async function fetchItems(
  collectionType: CollectionType,
  page = 1,
  limit = 50,
): Promise<PaginatedResponse<BrowseItem>> {
  const path = `${ITEM_PATHS[collectionType]}?page=${page}&limit=${limit}`;
  return apiClient.get<PaginatedResponse<BrowseItem>>(path);
}

export async function fetchItemDetail(
  collectionType: CollectionType,
  id: string,
): Promise<DetailItem> {
  return apiClient.get<DetailItem>(`${ITEM_PATHS[collectionType]}/${id}`);
}
