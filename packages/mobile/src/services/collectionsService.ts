import { CollectionType } from '@my-collections/shared';
import type { PaginatedResponse } from '@my-collections/shared';
import { apiClient } from '../api/client';

export interface CatalogItem {
  id: string;
  name: string;
  accessories: string[];
  catalogImageUrl?: string | null;
}

export interface CreateItemPayload {
  catalogId: string;
  isOwned: boolean;
  wishlistPriority?: string;
  condition?: string;
  packagingCondition?: string;
  isComplete?: boolean;
  ownedAccessories?: string[];
  isCarded?: boolean;
  isBoxed?: boolean;
  hasInstructions?: boolean;
  hasTechSpec?: boolean;
  rubSign?: boolean;
  hasBackCard?: boolean;
  acquisitionSource?: string;
  acquisitionDate?: string;
  acquisitionPrice?: number;
  estimatedValue?: number;
  notes?: string;
  photoUrls?: string[];
}

export type UpdateItemPayload = Omit<CreateItemPayload, 'catalogId'>;

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
    // Star Wars
    category?: string | null;
    figureSize?: string | null;
    coinIncluded?: boolean | null;
    // Transformers
    faction?: string | null;
    line?: string | null;
    releaseYear?: number | null;
    size?: string | null;
    altMode?: string | null;
    subgroup?: string | null;
    combinerTeam?: string | null;
    isCombiner?: boolean;
    isVariant?: boolean;
    variantDescription?: string | null;
    japaneseRelease?: boolean;
    isGiftSet?: boolean;
    isMailaway?: boolean;
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

const CATALOG_PATHS: Record<CollectionType, string> = {
  [CollectionType.STAR_WARS]: '/collections/star-wars/catalog',
  [CollectionType.TRANSFORMERS]: '/collections/transformers/catalog',
  [CollectionType.HE_MAN]: '/collections/he-man/catalog',
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

export async function searchCatalog(
  collectionType: CollectionType,
  query: string,
  limit = 20,
): Promise<CatalogItem[]> {
  const path = `${CATALOG_PATHS[collectionType]}?search=${encodeURIComponent(query)}&limit=${limit}`;
  const res = await apiClient.get<PaginatedResponse<CatalogItem>>(path);
  return res.data;
}

export async function createItem(
  collectionType: CollectionType,
  dto: CreateItemPayload,
): Promise<DetailItem> {
  return apiClient.post<DetailItem>(ITEM_PATHS[collectionType], dto);
}

export async function updateItem(
  collectionType: CollectionType,
  id: string,
  dto: UpdateItemPayload,
): Promise<DetailItem> {
  return apiClient.patch<DetailItem>(`${ITEM_PATHS[collectionType]}/${id}`, dto);
}

export async function deleteItem(
  collectionType: CollectionType,
  id: string,
): Promise<void> {
  return apiClient.delete(`${ITEM_PATHS[collectionType]}/${id}`);
}
