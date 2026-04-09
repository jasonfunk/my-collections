import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { CollectionItem, PaginatedResponse } from '@my-collections/shared';
import { apiClient } from '@/api/client.js';
import { getConfig } from '@/lib/collectionConfig.js';
import { FilterBar } from '@/components/collections/FilterBar.js';
import { ItemCard, ItemCardSkeleton } from '@/components/collections/ItemCard.js';
import { ItemTable, ItemTableSkeleton } from '@/components/collections/ItemTable.js';
import { Button } from '@/components/ui/button.js';
import { ArrowLeftIcon } from 'lucide-react';

export function CollectionListPage() {
  const { collection } = useParams<{ collection: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const config = collection ? getConfig(collection) : null;

  const view = searchParams.get('view') ?? 'grid';

  // Build API query string from filter params
  const apiParams = new URLSearchParams();
  const owned = searchParams.get('owned');
  if (owned !== null) apiParams.set('owned', owned);
  const condition = searchParams.get('condition');
  if (condition) apiParams.set('condition', condition);
  const line = searchParams.get('line');
  if (line) apiParams.set('line', line);
  const faction = searchParams.get('faction');
  if (faction) apiParams.set('faction', faction);
  const acquisitionSource = searchParams.get('acquisitionSource');
  if (acquisitionSource) apiParams.set('acquisitionSource', acquisitionSource);
  const isComplete = searchParams.get('isComplete');
  if (isComplete !== null) apiParams.set('isComplete', isComplete);
  const search = searchParams.get('search');
  if (search) apiParams.set('search', search);

  const queryString = apiParams.toString();
  const url = config ? `${config.apiPath}${queryString ? `?${queryString}` : ''}` : '';

  // All hooks must be called before any early return
  // API returns PaginatedResponse<CollectionItem> — extract .data for the item array
  const { data: page, isPending, isError } = useQuery({
    queryKey: ['collection', config?.key ?? '', queryString],
    queryFn: () => apiClient.get<PaginatedResponse<CollectionItem>>(url),
    enabled: !!config,
  });
  const items = page?.data;

  if (!config) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Collection not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40">
      {/* Top nav */}
      <header className="border-b bg-background px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <ArrowLeftIcon className="mr-1 h-4 w-4" />
            Dashboard
          </Button>
          <h1 className="text-xl font-semibold flex-1">
            {config.emoji} {config.label}
          </h1>
          <Button variant="ghost" size="sm" onClick={() => navigate('/wishlist')}>
            Wishlist
          </Button>
          <Button size="sm" onClick={() => navigate(`/collections/${collection}/new`)}>
            + Add Item
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-6 space-y-4">
        <FilterBar config={config} totalCount={page?.meta.total} />

        {isPending ? (
          view === 'grid' ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => <ItemCardSkeleton key={i} />)}
            </div>
          ) : (
            <ItemTableSkeleton />
          )
        ) : isError ? (
          <p className="text-sm text-destructive">Failed to load items. Please refresh.</p>
        ) : items && items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
            <p className="text-lg font-medium text-muted-foreground">No items found</p>
            <p className="mt-1 text-sm text-muted-foreground">Try adjusting your filters</p>
          </div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items!.map((item) => (
              <ItemCard key={item.id} item={item} collectionKey={config.key} />
            ))}
          </div>
        ) : (
          <ItemTable items={items!} collectionKey={config.key} />
        )}
      </main>
    </div>
  );
}
