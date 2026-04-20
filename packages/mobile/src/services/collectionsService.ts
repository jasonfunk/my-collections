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
