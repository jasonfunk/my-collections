import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SearchIcon, ArrowLeftIcon } from 'lucide-react';
import type { CollectionItem, PaginatedResponse } from '@my-collections/shared';
import { CollectionType } from '@my-collections/shared';
import { apiClient } from '@/api/client.js';
import { Button } from '@/components/ui/button.js';
import { Input } from '@/components/ui/input.js';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.js';
import { Separator } from '@/components/ui/separator.js';
import { ItemCard, ItemCardSkeleton } from '@/components/collections/ItemCard.js';
import { CONDITION_OPTIONS } from '@/lib/collectionConfig.js';
import type { CollectionKey } from '@/lib/collectionConfig.js';

const COLLECTION_TYPE_OPTIONS = [
  { value: CollectionType.STAR_WARS, label: '⭐ Star Wars', key: 'star-wars' as CollectionKey },
  { value: CollectionType.TRANSFORMERS, label: '🤖 Transformers', key: 'transformers' as CollectionKey },
  { value: CollectionType.HE_MAN, label: '⚔️ He-Man', key: 'he-man' as CollectionKey },
];

function collectionTypeToKey(type: string): CollectionKey {
  if (type === CollectionType.STAR_WARS) return 'star-wars';
  if (type === CollectionType.TRANSFORMERS) return 'transformers';
  return 'he-man';
}

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const q = searchParams.get('q') ?? '';
  const collectionType = searchParams.get('collectionType') ?? '';
  const condition = searchParams.get('condition') ?? '';
  const isOwned = searchParams.get('isOwned') ?? '';
  const isComplete = searchParams.get('isComplete') ?? '';

  // Local state for search input — debounced before writing to URL
  const [searchInput, setSearchInput] = useState(q);

  useEffect(() => {
    setSearchInput(searchParams.get('q') ?? '');
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (searchInput) {
          next.set('q', searchInput);
        } else {
          next.delete('q');
        }
        return next;
      }, { replace: true });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, setSearchParams]);

  function setParam(key: string, value: string | null) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      return next;
    }, { replace: true });
  }

  // Build API query string
  const apiParams = new URLSearchParams();
  if (q) apiParams.set('q', q);
  if (collectionType) apiParams.set('collectionType', collectionType);
  if (condition) apiParams.set('condition', condition);
  if (isOwned) apiParams.set('isOwned', isOwned);
  if (isComplete) apiParams.set('isComplete', isComplete);

  const queryString = apiParams.toString();

  const { data: page, isPending, isError } = useQuery({
    queryKey: ['global-search', queryString],
    queryFn: () => apiClient.get<PaginatedResponse<CollectionItem>>(`/collections/search?${queryString}`),
    enabled: !!q,
  });

  const items = page?.data;
  const ownedFilter = isOwned === 'true' ? 'owned' : isOwned === 'false' ? 'wishlist' : 'all';
  const isCompleteFilter = isComplete === 'true' ? 'complete' : isComplete === 'false' ? 'incomplete' : 'all';

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b bg-background px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <ArrowLeftIcon className="mr-1 h-4 w-4" />
            Dashboard
          </Button>
          <h1 className="text-xl font-semibold flex-1">Search Collections</h1>
          <Button variant="ghost" size="sm" onClick={() => navigate('/wishlist')}>
            Wishlist
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-6 space-y-4">
        {/* Search input */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search across all your collections by name or notes…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-10 pl-9 text-base"
            autoFocus
          />
        </div>

        {/* Filter panel */}
        <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-background p-3">
          {/* Collection type */}
          <Select value={collectionType} onValueChange={(v) => setParam('collectionType', v === '__all__' ? null : v)}>
            <SelectTrigger className="h-8 w-44 text-sm">
              <SelectValue placeholder="All collections" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All collections</SelectItem>
              {COLLECTION_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Separator orientation="vertical" className="h-6" />

          {/* Owned / Wishlist */}
          <ToggleGroup
            type="single"
            value={ownedFilter}
            onValueChange={(v) => {
              if (!v) return;
              if (v === 'owned') setParam('isOwned', 'true');
              else if (v === 'wishlist') setParam('isOwned', 'false');
              else setParam('isOwned', null);
            }}
            variant="outline"
          >
            <ToggleGroupItem value="all">All</ToggleGroupItem>
            <ToggleGroupItem value="owned">Owned</ToggleGroupItem>
            <ToggleGroupItem value="wishlist">Wishlist</ToggleGroupItem>
          </ToggleGroup>

          <Separator orientation="vertical" className="h-6" />

          {/* Complete / Incomplete */}
          <ToggleGroup
            type="single"
            value={isCompleteFilter}
            onValueChange={(v) => {
              if (!v) return;
              if (v === 'complete') setParam('isComplete', 'true');
              else if (v === 'incomplete') setParam('isComplete', 'false');
              else setParam('isComplete', null);
            }}
            variant="outline"
          >
            <ToggleGroupItem value="all">Any</ToggleGroupItem>
            <ToggleGroupItem value="complete">Complete</ToggleGroupItem>
            <ToggleGroupItem value="incomplete">Incomplete</ToggleGroupItem>
          </ToggleGroup>

          <Separator orientation="vertical" className="h-6" />

          {/* Condition */}
          <Select value={condition} onValueChange={(v) => setParam('condition', v === '__all__' ? null : v)}>
            <SelectTrigger className="h-8 w-44 text-sm">
              <SelectValue placeholder="Condition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Any condition</SelectItem>
              {CONDITION_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {page?.meta.total !== undefined && (
            <span className="ml-auto text-sm text-muted-foreground">
              {page.meta.total} {page.meta.total === 1 ? 'result' : 'results'}
            </span>
          )}
        </div>

        {/* Results */}
        {!q ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-20 text-center">
            <SearchIcon className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-lg font-medium text-muted-foreground">Search across all your collections</p>
            <p className="mt-1 text-sm text-muted-foreground">Type a name or keyword above to get started</p>
          </div>
        ) : isPending ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <ItemCardSkeleton key={i} />)}
          </div>
        ) : isError ? (
          <p className="text-sm text-destructive">Search failed. Please try again.</p>
        ) : items && items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
            <p className="text-lg font-medium text-muted-foreground">No results for &ldquo;{q}&rdquo;</p>
            <p className="mt-1 text-sm text-muted-foreground">Try a different keyword or adjust the filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items!.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                collectionKey={collectionTypeToKey(item.collectionType)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
