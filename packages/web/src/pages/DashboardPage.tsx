import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { SearchIcon } from 'lucide-react';
import type { CollectionStats, RecentCollectionItem, UserProfile } from '@my-collections/shared';
import { CollectionType } from '@my-collections/shared';
import { apiClient } from '../api/client.js';
import { useAuth } from '../hooks/useAuth.js';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card.js';
import { Button } from '../components/ui/button.js';
import { Skeleton } from '../components/ui/skeleton.js';
import { CollectionProgressIcon } from '../components/ui/collection-progress-icon.js';
import { ConditionBadge } from '../components/collections/ConditionBadge.js';
import type { CollectionKey } from '../lib/collectionConfig.js';

function formatCurrency(value: number | null): string {
  if (value === null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

function formatRelativeDate(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  if (diffDays === 0) return 'today';
  if (diffDays < 7) return rtf.format(-diffDays, 'day');
  if (diffDays < 30) return rtf.format(-Math.floor(diffDays / 7), 'week');
  return rtf.format(-Math.floor(diffDays / 30), 'month');
}

const RECENT_COLLECTION_META: Record<CollectionType, { label: string; route: string; color: string }> = {
  [CollectionType.STAR_WARS]:    { label: 'Star Wars',    route: 'star-wars',    color: 'text-amber-400'  },
  [CollectionType.TRANSFORMERS]: { label: 'Transformers', route: 'transformers', color: 'text-blue-400'   },
  [CollectionType.HE_MAN]:       { label: 'He-Man',       route: 'he-man',       color: 'text-purple-400' },
};

function RecentItemRow({ item }: { item: RecentCollectionItem }) {
  const navigate = useNavigate();
  const meta = RECENT_COLLECTION_META[item.collectionType];
  return (
    <button
      type="button"
      onClick={() => navigate(`/collections/${meta.route}/${item.catalogId}`)}
      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <div className="h-full w-full" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.name}</p>
        <p className={`text-xs ${meta.color}`}>{meta.label}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        {item.condition && <ConditionBadge grade={item.condition} />}
        <span className="text-xs text-muted-foreground">{formatRelativeDate(item.createdAt)}</span>
      </div>
    </button>
  );
}

interface CollectionCardProps {
  title: string;
  subtitle: string;
  collectionKey: CollectionKey;
  owned: number;
  catalogTotal: number;
  wishlist: number;
  value: number | null;
  href: string;
  accent: string;
}

const COUNT_COLORS: Record<CollectionKey, string> = {
  'star-wars':    'text-amber-400',
  'transformers': 'text-blue-400',
  'he-man':       'text-purple-400',
};

const COUNT_BORDERS: Record<CollectionKey, string> = {
  'star-wars':    'border-amber-500/50',
  'transformers': 'border-blue-500/50',
  'he-man':       'border-purple-500/50',
};

function CollectionCard({ title, subtitle, collectionKey, owned, catalogTotal, wishlist, value, href, accent }: CollectionCardProps) {
  const navigate = useNavigate();
  return (
    <Card
      className={`cursor-pointer transition-shadow hover:shadow-lg border-t-2 ${accent}`}
      onClick={() => navigate(href)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <CollectionProgressIcon collectionKey={collectionKey} owned={owned} catalogTotal={catalogTotal} />
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base font-semibold leading-none">{title}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2 pb-4">
        <div className="flex justify-center mb-3">
          <div className={`border ${COUNT_BORDERS[collectionKey]} rounded-xl px-8 py-3 text-center`}>
            <div className={`text-4xl font-bold ${COUNT_COLORS[collectionKey]}`}>{owned}</div>
            <p className="text-xs text-muted-foreground mt-0.5">owned</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground text-center">
          {wishlist} on wishlist · est. {formatCurrency(value)}
        </p>
      </CardContent>
    </Card>
  );
}

function CollectionCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-5 w-20" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-9 w-16 mb-2" />
        <Skeleton className="h-4 w-48" />
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const statsQuery = useQuery({
    queryKey: ['collection-stats'],
    queryFn: () => apiClient.get<CollectionStats>('/collections/stats'),
  });

  const healthQuery = useQuery({
    queryKey: ['health'],
    queryFn: () => apiClient.get<{ status: string; version: string }>('/health'),
    staleTime: Infinity,
  });

  const recentQuery = useQuery({
    queryKey: ['collection-recent'],
    queryFn: () => apiClient.get<RecentCollectionItem[]>('/collections/recent?limit=10'),
  });

  const profileQuery = useQuery({
    queryKey: ['user-me'],
    queryFn: () => apiClient.get<UserProfile>('/users/me'),
    initialData: user ?? undefined,
  });

  const displayName = profileQuery.data?.email ?? user?.email ?? 'Collector';
  const stats = statsQuery.data;
  const isLoading = statsQuery.isPending;

  return (
    <div className="min-h-screen bg-muted">
      {/* Top nav */}
      <header className="border-b bg-background px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">My Collections</h1>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/search')}>
              <SearchIcon className="mr-1 h-4 w-4" />
              Search
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/wishlist')}>
              Wishlist
            </Button>
            <span className="text-sm text-muted-foreground">{displayName}</span>
            <Button variant="outline" size="sm" onClick={logout}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-5xl px-6 py-8">
        <h2 className="mb-6 text-2xl font-bold">Dashboard</h2>

        {/* Collection cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          {isLoading ? (
            <>
              <CollectionCardSkeleton />
              <CollectionCardSkeleton />
              <CollectionCardSkeleton />
            </>
          ) : statsQuery.isError ? (
            <p className="col-span-3 text-sm text-destructive">
              Failed to load collection stats. Please refresh.
            </p>
          ) : (
            <>
              <CollectionCard
                title="Star Wars"
                subtitle="Original Trilogy · 1977–1985"
                collectionKey="star-wars"
                owned={stats!.starWars.owned}
                catalogTotal={stats!.starWars.catalogTotal}
                wishlist={stats!.starWars.wishlist}
                value={stats!.starWars.estimatedTotalValue}
                href="/collections/star-wars"
                accent="border-t-amber-500/70"
              />
              <CollectionCard
                title="Transformers"
                subtitle="Generation 1 · Series 1–6 · 1984–1990"
                collectionKey="transformers"
                owned={stats!.transformers.owned}
                catalogTotal={stats!.transformers.catalogTotal}
                wishlist={stats!.transformers.wishlist}
                value={stats!.transformers.estimatedTotalValue}
                href="/collections/transformers"
                accent="border-t-blue-500/70"
              />
              <CollectionCard
                title="He-Man"
                subtitle="Masters of the Universe · 1981–1988"
                collectionKey="he-man"
                owned={stats!.heman.owned}
                catalogTotal={stats!.heman.catalogTotal}
                wishlist={stats!.heman.wishlist}
                value={stats!.heman.estimatedTotalValue}
                href="/collections/he-man"
                accent="border-t-purple-500/70"
              />
            </>
          )}
        </div>

        {/* Totals row */}
        {!isLoading && !statsQuery.isError && stats && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base font-medium">Collection Totals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold">{stats.totals.owned}</div>
                  <p className="text-sm text-muted-foreground">Total owned</p>
                </div>
                <div>
                  <div className="text-3xl font-bold">{stats.totals.wishlist}</div>
                  <p className="text-sm text-muted-foreground">On wishlist</p>
                </div>
                <div>
                  <div className="text-3xl font-bold">{formatCurrency(stats.totals.estimatedTotalValue)}</div>
                  <p className="text-sm text-muted-foreground">Est. total value</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recently Added */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base font-medium">Recently Added</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentQuery.isPending ? (
              <div className="divide-y">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <Skeleton className="h-10 w-10 rounded-md" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-48" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                ))}
              </div>
            ) : recentQuery.isError ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                Could not load recent items.
              </p>
            ) : recentQuery.data?.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                No items added yet. Start by adding to a collection.
              </p>
            ) : (
              <div className="divide-y">
                {recentQuery.data?.map((item) => (
                  <RecentItemRow key={item.id} item={item} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <footer className="pb-6 text-center text-xs text-muted-foreground/50">
        SPA v{__APP_VERSION__} · API v{healthQuery.data?.version ?? '…'}
      </footer>
    </div>
  );
}
