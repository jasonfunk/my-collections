import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { StarWarsCatalogItem, UserStarWarsItem, PaginatedResponse } from '@my-collections/shared';
import { apiClient } from '@/api/client.js';
import {
  DEFAULT_PAGE_SIZE,
  MAX_USER_ITEMS_FETCH,
  STAR_WARS_CATEGORY_OPTIONS,
  STAR_WARS_LINE_LABELS,
  WISHLIST_PRIORITY_OPTIONS,
} from '@/lib/collectionConfig.js';
import { StarWarsCatalogCard, StarWarsCatalogCardSkeleton } from '@/components/collections/StarWarsCatalogCard.js';
import { CollectionIcon } from '@/components/ui/collection-icons.js';
import { Button } from '@/components/ui/button.js';
import { Input } from '@/components/ui/input.js';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.js';
import { Separator } from '@/components/ui/separator.js';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group.js';
import { ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

type ClaimedFilter = 'all' | 'owned' | 'wishlist';

export function StarWarsCatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const claimedFilter = (searchParams.get('claimed') ?? 'all') as ClaimedFilter;
  const line = searchParams.get('line') ?? '';
  const category = searchParams.get('category') ?? '';
  const priority = searchParams.get('priority') ?? '';
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '');

  function setParam(key: string, value: string | null) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value);
      else next.delete(key);
      return next;
    }, { replace: true });
  }

  function setPage(p: number) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (p === 1) next.delete('page');
      else next.set('page', String(p));
      return next;
    }, { replace: true });
  }

  function resetPage() {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('page');
      return next;
    }, { replace: true });
  }

  // Build catalog query string (server-side: line, category, search, page)
  const catalogParams = new URLSearchParams({ limit: String(DEFAULT_PAGE_SIZE), page: String(page) });
  if (line) catalogParams.set('line', line);
  if (category) catalogParams.set('category', category);
  if (searchInput) catalogParams.set('search', searchInput);
  const catalogQs = catalogParams.toString();

  const { data: catalogPage, isPending: catalogPending } = useQuery({
    queryKey: ['sw-catalog', catalogQs],
    queryFn: () => apiClient.get<PaginatedResponse<StarWarsCatalogItem>>(`/collections/star-wars/catalog?${catalogQs}`),
  });

  const { data: userItemsPage, isPending: userItemsPending } = useQuery({
    queryKey: ['sw-user-items'],
    queryFn: () => apiClient.get<PaginatedResponse<UserStarWarsItem>>(`/collections/star-wars/items?limit=${MAX_USER_ITEMS_FETCH}`),
  });

  // Build O(1) lookup map: catalogId → UserStarWarsItem
  const userItemMap = new Map<string, UserStarWarsItem>(
    (userItemsPage?.data ?? []).map((item) => [item.catalogId, item]),
  );

  const ownedCount = (userItemsPage?.data ?? []).filter((i) => i.isOwned).length;
  const catalogTotal = catalogPage?.meta.total ?? 0;
  const totalPages = catalogPage?.meta.totalPages ?? 1;

  // Determine what to display based on filter mode
  const isUserItemMode = claimedFilter === 'owned' || claimedFilter === 'wishlist';

  // In "all" mode: use catalog page (server-side filtered), merge user item status
  // In "owned"/"wishlist" modes: render from user items directly (with embedded catalog)
  let displayCatalogItems: StarWarsCatalogItem[] = [];
  let displayUserItems: UserStarWarsItem[] = [];

  if (claimedFilter === 'all') {
    displayCatalogItems = catalogPage?.data ?? [];
  } else if (claimedFilter === 'owned') {
    displayUserItems = (userItemsPage?.data ?? []).filter((i) => i.isOwned);
  } else {
    displayUserItems = (userItemsPage?.data ?? []).filter((i) => !i.isOwned);
    if (priority) {
      displayUserItems = displayUserItems.filter((i) => i.wishlistPriority === priority);
    }
  }

  const displayCount = isUserItemMode ? displayUserItems.length : catalogTotal;
  const displayCountLabel = claimedFilter === 'owned'
    ? `${displayUserItems.length} owned`
    : claimedFilter === 'wishlist'
    ? `${displayUserItems.length} on wishlist`
    : `${displayCount} ${displayCount === 1 ? 'item' : 'items'}`;

  const showSkeleton = isUserItemMode ? userItemsPending : catalogPending;

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b bg-background px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <ArrowLeftIcon className="mr-1 h-4 w-4" />
            Dashboard
          </Button>
          <div className="flex-1 flex items-center gap-3">
            <CollectionIcon variant="star-wars" size={32} />
            <div>
              <h1 className="text-xl font-semibold leading-none">Star Wars</h1>
              <p className="text-xs text-muted-foreground mt-1">Original Trilogy · 1977–1985</p>
            </div>
          </div>
          <span className="text-sm text-muted-foreground">
            {ownedCount} of {catalogTotal} owned
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-6 space-y-4">
        {/* Search */}
        <Input
          type="search"
          placeholder="Search Star Wars catalog by name…"
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value);
            const v = e.target.value;
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev);
              if (v) next.set('search', v);
              else next.delete('search');
              next.delete('page');
              return next;
            }, { replace: true });
          }}
          className="h-9"
        />

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-background p-3">
          {/* Claimed status */}
          <ToggleGroup
            type="single"
            value={claimedFilter}
            onValueChange={(v) => v && setParam('claimed', v === 'all' ? null : v)}
            variant="outline"
          >
            <ToggleGroupItem value="all">All</ToggleGroupItem>
            <ToggleGroupItem value="owned">Owned</ToggleGroupItem>
            <ToggleGroupItem value="wishlist">Wishlist</ToggleGroupItem>
          </ToggleGroup>

          <Separator orientation="vertical" className="h-6" />

          {/* Line filter */}
          <Select
            value={line}
            onValueChange={(v) => {
              setParam('line', v === '__all__' ? null : v);
              resetPage();
            }}
          >
            <SelectTrigger className="h-8 w-48 text-sm">
              <SelectValue placeholder="Any line" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Any line</SelectItem>
              {Object.entries(STAR_WARS_LINE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Category filter */}
          <Select
            value={category}
            onValueChange={(v) => {
              setParam('category', v === '__all__' ? null : v);
              resetPage();
            }}
          >
            <SelectTrigger className="h-8 w-40 text-sm">
              <SelectValue placeholder="Any type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Any type</SelectItem>
              {STAR_WARS_CATEGORY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Priority filter (wishlist only) */}
          {claimedFilter === 'wishlist' && (
            <Select value={priority} onValueChange={(v) => setParam('priority', v === '__all__' ? null : v)}>
              <SelectTrigger className="h-8 w-36 text-sm">
                <SelectValue placeholder="Any priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Any priority</SelectItem>
                {WISHLIST_PRIORITY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <span className="ml-auto text-sm text-muted-foreground">
            {displayCountLabel}
          </span>
        </div>

        {/* Grid */}
        {showSkeleton ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <StarWarsCatalogCardSkeleton key={i} />)}
          </div>
        ) : isUserItemMode ? (
          displayUserItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
              <p className="text-lg font-medium text-muted-foreground">No items found</p>
              <p className="mt-1 text-sm text-muted-foreground">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {displayUserItems.map((ui) => (
                <StarWarsCatalogCard
                  key={ui.id}
                  catalogItem={ui.catalog!}
                  userItem={ui}
                />
              ))}
            </div>
          )
        ) : displayCatalogItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
            <p className="text-lg font-medium text-muted-foreground">No items found</p>
            <p className="mt-1 text-sm text-muted-foreground">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {displayCatalogItems.map((ci) => (
              <StarWarsCatalogCard
                key={ci.id}
                catalogItem={ci}
                userItem={userItemMap.get(ci.id)}
              />
            ))}
          </div>
        )}

        {/* Pagination (all mode only) */}
        {!isUserItemMode && totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeftIcon className="h-4 w-4" />
              Prev
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
